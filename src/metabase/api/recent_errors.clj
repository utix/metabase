(ns metabase.api.recent-errors
  (:require [amalloy.ring-buffer :as ring-buffer]
            [compojure.core :refer [GET]]
            [metabase.api.common :as api]))

(set! *warn-on-reflection* true)

(def ^:private recent-errors (atom (ring-buffer/ring-buffer 10)))

(defn record!
  "Records an exception and the time it occurred so we can tell the frontend about it later."
  [e]
  (swap! recent-errors conj {:error e
                             :occurred-at (java.time.Instant/now)}))

;; record an exception for dev
(record! (ex-info "meow mix meow mix we deliver" {}))

(api/defendpoint GET "/recent"
  []
  (map (fn [m] (update m :error #(.getMessage ^Throwable %))) @recent-errors))

(api/define-routes)
