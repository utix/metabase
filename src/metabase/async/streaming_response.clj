(ns metabase.async.streaming-response
  (:require
   [cheshire.core :as json]
   [clojure.core.async :as a]
   [clojure.walk :as walk]
   [compojure.response]
   [metabase.async.streaming-response.thread-pool :as thread-pool]
   [metabase.async.util :as async.u]
   [metabase.server.protocols :as server.protocols]
   [metabase.util :as u]
   [metabase.util.log :as log]
   [potemkin.types :as p.types]
   [pretty.core :as pretty]
   [ring.util.jakarta.servlet :as servlet]
   [ring.util.response :as response])
  (:import
   (jakarta.servlet AsyncContext)
   (jakarta.servlet.http HttpServletResponse)
   (java.io BufferedWriter OutputStream OutputStreamWriter)
   (java.nio ByteBuffer)
   (java.nio.channels ClosedChannelException SocketChannel)
   (java.nio.charset StandardCharsets)
   (java.util.zip GZIPOutputStream)
   (org.eclipse.jetty.io EofException SocketChannelEndPoint)
   (org.eclipse.jetty.server Request)))

(set! *warn-on-reflection* true)

(defn- write-to-output-stream!
  ([^OutputStream os x]
   (if (int? x)
     (.write os ^int x)
     (.write os ^bytes x)))

  ([^OutputStream os ^bytes ba ^Integer offset ^Integer len]
   (.write os ba offset len)))

(defn- ex-status-code [e]
  (or (some #((some-fn :status-code :status) (ex-data %))
            (take-while some? (iterate ex-cause e)))
      500))

(defn- format-exception [e]
  (assoc (Throwable->map e) :_status (ex-status-code e)))

(defn write-error!
  "Write an error to the output stream, formatting it nicely. Closes output stream afterwards."
  [^OutputStream os obj export-format]
  (cond
    (some #(instance? % obj)
          [InterruptedException EofException])
    (log/trace "Error is an InterruptedException or EofException, not writing to output stream")

    (instance? Throwable obj)
    (recur os (format-exception obj) export-format)

    :else
    (with-open [os os]
      (log/trace (u/pprint-to-str (list 'write-error! obj)))
      (try
        (let [obj (-> (if (not= :api export-format)
                        (walk/prewalk
                         (fn [x]
                           (if (map? x)
                             (apply dissoc x [:json_query :preprocessed])
                             x))
                         obj)
                        obj)
                      (dissoc :export-format))]
          (with-open [writer (BufferedWriter. (OutputStreamWriter. os StandardCharsets/UTF_8))]
            (json/generate-stream obj writer)))
        (catch EofException _)
        (catch Throwable e
          (log/error e "Error writing error to output stream" obj))))))

(defn- do-f* [f ^OutputStream os _finished-chan canceled-chan]
  (try
    (f os canceled-chan)
    (catch EofException _
      (a/>!! canceled-chan ::jetty-eof)
      nil)
    (catch InterruptedException _
      (a/>!! canceled-chan ::thread-interrupted)
      nil)
    (catch Throwable e
      (log/error e "Caught unexpected Exception in streaming response body")
      (write-error! os e nil)
      nil)))

(defn- do-f-async
  "Runs `f` asynchronously on the streaming response `thread-pool`, returning immediately. When `f` finishes,
  completes (i.e., closes) Jetty `async-context`."
  [^AsyncContext async-context f ^OutputStream os finished-chan canceled-chan]
  {:pre [(some? os)]}
  (let [task (^:once fn* []
               (try
                 (do-f* f os finished-chan canceled-chan)
                 (catch Throwable e
                   (log/error e "bound-fn caught unexpected Exception")
                   (a/>!! finished-chan :unexpected-error))
                 (finally
                   (a/>!! finished-chan (if (a/poll! canceled-chan)
                                          :canceled
                                          :completed))
                   (a/close! finished-chan)
                   (a/close! canceled-chan)
                   (.complete async-context))))]
    (.submit (thread-pool/thread-pool) ^Runnable task)
    nil))

;; `ring.middleware.gzip` doesn't work on our StreamingResponse class.
(defn- should-gzip-response?
  "Does the client accept GZIP-encoded responses?"
  [{{:strs [accept-encoding]} :headers}]
  (some->> accept-encoding (re-find #"gzip|\*")))

(defn- output-stream-delay [gzip? ^HttpServletResponse response]
  (if gzip?
    (delay
      (GZIPOutputStream. (.getOutputStream response) true))
    (delay
      (.getOutputStream response))))

(defn- delay-output-stream
  "An OutputStream proxy that fetches the actual output stream by dereffing a delay (or other dereffable) before first
  use."
  [dlay]
  (proxy [OutputStream] []
    (close []
      (.close ^OutputStream @dlay))
    (flush []
      (.flush ^OutputStream @dlay))
    (write
      ([x]
       (write-to-output-stream! @dlay x))
      ([ba offset length]
       (write-to-output-stream! @dlay ba offset length)))))

(def ^:private async-cancellation-poll-interval-ms
  "How often to check whether the request was canceled by the client."
  1000)

(p.types/defprotocol+ ^:private ChannelProvider
  "Protocol to get a SocketChannel from various types of transports."
  (^SocketChannel get-channel [transport] "Method to extract a SocketChannel."))

;; Extend the protocol to SocketChannel, returning itself
(extend-protocol ChannelProvider
  SocketChannel
  (get-channel [self] self)

  SocketChannelEndPoint
  (get-channel [self] (.getChannel self))

  Object
  (get-channel [_] nil))

(def ^:private *reported-types
  "A set of types returned from `.getTransport` have already been reported as errors. This is used to avoid spamming the logs with the same
  error over and over."
  (atom #{}))

(defn log-unexpected-transport!
  "Log an error when an unexpected transport is encountered."
  [transport]
  (let [transport-type (type transport)]
    (when-not (contains? @*reported-types transport-type)
      (log/errorf "Unexpected transport type encountered in `canceled?`: %s" transport-type))
    (swap! *reported-types conj transport-type)))

(defn- canceled?
  "Check whether the HTTP request has been canceled by the client. This function uses `HttpEndpoint.isOpen` method which
  is not guaranteed to return false in case the client closes the connection, but it's the best heuristic we have."
  [^Request request]
  (try
    (let [endpoint (.. request getHttpChannel getEndPoint)
          is-open  (.isOpen endpoint)]
      (log/tracef "Check cancelation status: .osOpen returned %s" is-open)
      (not is-open))
    (catch InterruptedException _ false)
    (catch ClosedChannelException _ true)
    (catch Throwable e
      (log/error e "Error determining whether HTTP request was canceled")
      false)))

(def ^:private async-cancellation-poll-timeout-ms
  "How long to wait for the cancelation check to complete (it should usually complete immediately -- see above -- but if
  it doesn't, we don't want to block forever)."
  1000)

(defn- start-async-cancel-loop!
  "Starts an async loop that checks whether the client has canceled HTTP `request` at some interval. If the client has
  canceled the request, this sends a message to `canceled-chan`."
  [request finished-chan canceled-chan]
  (a/go-loop []
    (let [poll-timeout-chan (a/timeout async-cancellation-poll-interval-ms)
          [_ port]          (a/alts! [poll-timeout-chan finished-chan])]
      (when (= port poll-timeout-chan)
        (log/tracef "Checking cancelation status after waiting %s" (u/format-milliseconds async-cancellation-poll-interval-ms))
        (let [canceled-status-chan (async.u/cancelable-thread (canceled? request))
              status-timeout-chan  (a/timeout async-cancellation-poll-timeout-ms)
              [canceled? port]     (a/alts! [finished-chan canceled-status-chan status-timeout-chan])]
          ;; if `canceled-status-chan` *wasn't* the first channel to return (i.e., we either timed out or the request
          ;; was completed) then close `canceled-status-chan` which will kill the underlying thread
          (a/close! canceled-status-chan)
          (when (= port status-timeout-chan)
            (log/debugf "Check cancelation status timed out after %s"
                        (u/format-milliseconds async-cancellation-poll-timeout-ms)))
          (when (not= port finished-chan)
            (if canceled?
              (a/>! canceled-chan ::request-canceled)
              (recur))))))))

(defn- respond
  [{:keys [^HttpServletResponse response ^AsyncContext async-context request-map response-map request]}
   f {:keys [content-type status headers], :as _options} finished-chan]
  (let [canceled-chan (a/promise-chan)]
    (try
      (.setStatus response (or status 202))
      (let [gzip?   (should-gzip-response? request-map)
            headers (cond-> (assoc (merge headers (:headers response-map)) "Content-Type" content-type)
                      gzip? (assoc "Content-Encoding" "gzip"))]
        (#'servlet/set-headers response headers)
        (let [output-stream-delay (output-stream-delay gzip? response)
              delay-os            (delay-output-stream output-stream-delay)]
          (start-async-cancel-loop! request finished-chan canceled-chan)
          (do-f-async async-context f delay-os finished-chan canceled-chan)))
      (catch Throwable e
        (log/error e "Unexpected exception in do-f-async")
        (try
          (.sendError response 500 (.getMessage e))
          (catch Throwable e
            (log/error e "Unexpected exception writing error response")))
        (a/>!! finished-chan :unexpected-error)
        (a/close! finished-chan)
        (a/close! canceled-chan)
        (.complete async-context)))))

(declare render)

(p.types/deftype+ StreamingResponse [f options donechan]
  pretty/PrettyPrintable
  (pretty [_]
    (list `->StreamingResponse f options donechan))

  server.protocols/Respond
  (respond [_this context]
    (respond context f options donechan))

  ;; sync responses only (in some cases?)
  compojure.response/Renderable
  (render [this request]
    (render this (should-gzip-response? request)))

  ;; async responses only
  compojure.response/Sendable
  (send* [this request respond* _raise]
    (respond* (compojure.response/render this request))))

(defn- render [^StreamingResponse streaming-response gzip?]
  (let [{:keys [headers content-type], :as options} (.options streaming-response)]
    (assoc (response/response (if gzip?
                                (StreamingResponse. (.f streaming-response)
                                                    (assoc options :gzip? true)
                                                    (.donechan streaming-response))
                                streaming-response))
           :headers      (cond-> (assoc headers "Content-Type" content-type)
                           gzip? (assoc "Content-Encoding" "gzip"))
           :status       (or (:status options) 202))))

(defn finished-chan
  "Fetch a promise channel that will get a message when a `StreamingResponse` is completely finished. Provided primarily
  for logging purposes."
  [^StreamingResponse response]
  (.donechan response))

(defn -streaming-response
  "Impl for [[streaming-response]] macro."
  [f options]
  (->StreamingResponse f options (a/promise-chan)))

(defmacro streaming-response
  "Create an API response that streams results to an `OutputStream`.

  Minimal example:

    (streaming-response {:content-type \"application/json; charset=utf-8\"} [os canceled-chan]
      (write-something-to-stream! os))

  `f` should block until it is completely finished writing to the stream, which will be closed thereafter.
  `canceled-chan` can be monitored to see if the request is canceled before results are fully written to the stream.

  Current options:

  *  `:content-type` -- string content type to return in the results. This is required!
  *  `:headers` -- other headers to include in the API response."
  {:style/indent 2, :arglists '([options [os-binding canceled-chan-binding] & body])}
  [options [os-binding canceled-chan-binding :as bindings] & body]
  {:pre [(= (count bindings) 2)]}
  `(-streaming-response (bound-fn [~(vary-meta os-binding assoc :tag 'java.io.OutputStream) ~canceled-chan-binding] ~@body)
                        ~options))
