(ns metabase.task.moderation-expiration
  "TODO -- this should be moved to `metabase-enterprise.content-verification.models.moderation-review` since it's a
  premium-only model."
  (:require
   [clojurewerkz.quartzite.jobs :as jobs]
   [clojurewerkz.quartzite.schedule.cron :as cron]
   [clojurewerkz.quartzite.triggers :as triggers]
   [metabase.public-settings :as public-settings]
   [metabase.query-analysis :as query-analysis]
   [metabase.task :as task]
   [metabase.util :as u]
   [metabase.util.log :as log]
   [toucan2.core :as t2]
   [toucan2.realize :as t2.realize]
   [clj-time.core :as time])
  (:import (org.quartz DisallowConcurrentExecution)))

(set! *warn-on-reflection* true)

(defonce sweep-reviews?
  ;; "Should we really sweep reviews?"
  (atom false))

(defn- moderation-reviews []
  (t2/select :model/ModerationReview :most_recent true))

(defn sweep-moderation-review! [conn now {:keys [id valid_until]}]
  (let [expired? (time/after? now valid_until)]
    (log/warnf "Sweeping moderation review %s date is : '%s' which is %sexpired" id valid_until (if expired? "not " ""))
    (t2/update! conn :model/ModerationReview :id id {:status "expired"})))

(defn sweep-moderation-reviews! [now]
  (let [moderation-reviews (moderation-reviews)]
    (t2/with-transaction [conn]
      (doseq [review moderation-reviews]
        (sweep-moderation-review! conn now review)))))

(jobs/defjob ^{DisallowConcurrentExecution true
               :doc                        "Sweep moderation reviews that have expired."}
  SweepModerationReviews [_ctx]
  (when @sweep-reviews?
    (let [now (time/now)]
      (sweep-moderation-reviews! now))))

(defmethod task/init! ::SweepModerationReviews [_]
  (let [job-key (jobs/key "metabase.task.moderation-expiration.job")
        job     (jobs/build
                 (jobs/of-type SweepModerationReviews)
                 (jobs/with-identity job-key)
                 (jobs/store-durably)
                 (jobs/request-recovery))
        trigger (triggers/build
                 (triggers/with-identity (triggers/key "metabase.task.moderation-expiration.trigger"))
                 (triggers/start-now)
                 (triggers/with-schedule
                  (cron/schedule
                   (cron/cron-schedule "0 0/10 0 * * ? *")
                   (cron/with-misfire-handling-instruction-ignore-misfires))))]
    ;; Schedule the repeats
    (task/schedule-task! job trigger)
    ;; Don't wait, try to kick it off immediately
    (task/trigger-now! job-key)))
