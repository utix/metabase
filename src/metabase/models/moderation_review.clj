(ns metabase.models.moderation-review
  "TODO -- this should be moved to `metabase-enterprise.content-verification.models.moderation-review` since it's a
  premium-only model."
  (:require
   [metabase.db.query :as mdb.query]
   [metabase.models.interface :as mi]
   [metabase.models.permissions :as perms]
   [metabase.moderation :as moderation]
   [metabase.util.malli :as mu]
   [metabase.util.malli.schema :as ms]
   [methodical.core :as methodical]
   [toucan2.core :as t2])
  (:import [java.time LocalDateTime]))

(def statuses
  "Schema enum of the acceptable values for the `status` column"
  #{"verified" "flagged" nil})

(def Statuses
  "Schema of valid statuses"
  [:maybe (into [:enum] statuses)])

(def reasons
  {:no-updates "No updates"
   :other      "Other"})

(def Reasons
  "Reasons for content verification."
  (into [:enum] (keys reasons)))

;;; currently unused, but I'm leaving this in commented out because it serves as documentation
(comment
  (def ReviewChanges
    "Schema for a ModerationReview that's being updated (so most keys are optional)"
    [:map
     [:id                  {:optional true} mu/IntGreaterThanZero]
     [:moderated_item_id   {:optional true} mu/IntGreaterThanZero]
     [:moderated_item_type {:optional true} moderation/moderated-item-types]
     [:status              {:optional true} Statuses]
     [:text                {:optional true} [:maybe :string]]

     [:reason              {:optional true} Reasons]
     [:valid_until         {:optional true} :any]]))

(def ModerationReview
  "Used to be the toucan1 model name defined using [[toucan.models/defmodel]], now it's a reference to the toucan2 model name.
  We'll keep this till we replace all the symbols in our codebase."
  :model/ModerationReview)

(methodical/defmethod t2/table-name :model/ModerationReview [_model] :moderation_review)

(doto :model/ModerationReview
  (derive :metabase/model)
  ;;; TODO: this is wrong, but what should it be?
  (derive ::perms/use-parent-collection-perms)
  (derive :hook/timestamped?))

(t2/deftransforms :model/ModerationReview
  {:moderated_item_type mi/transform-keyword})

(def max-moderation-reviews
  "The amount of moderation reviews we will keep on hand."
  10)

(mu/defn delete-extra-reviews!
  "Delete extra reviews to maintain an invariant of only `max-moderation-reviews`. Called before inserting so actually
  insures there are one fewer than [[max-moderation-reviews]] that so you can add afterwards."
  [item-id   :- :int
   item-type :- :string]
  (let [ids (into #{} (comp (map :id)
                            (drop (dec max-moderation-reviews)))
                  (mdb.query/query {:select   [:id]
                                    :from     [:moderation_review]
                                    :where    [:and
                                               [:= :moderated_item_id item-id]
                                               [:= :moderated_item_type item-type]]
                                    ;; cannot put the offset in this query as mysql doesnt place nice. It requires a limit
                                    ;; as well which we do not want to give. The offset is only 10 though so its not a huge
                                    ;; savings and we run this on every entry so the max number is 10, delete the extra,
                                    ;; and insert a new one to arrive at 10 again, our invariant.
                                    :order-by [[:id :desc]]}))]
    (when (seq ids)
      (t2/delete! ModerationReview :id [:in ids]))))

(mu/defn create-review!
  "Create a new ModerationReview"
  [params :- [:map
              [:moderated_item_id    ms/PositiveInt]
              [:moderated_item_type  moderation/moderated-item-types]
              [:moderator_id         ms/PositiveInt]
              [:status               {:optional true} Statuses]
              [:text                 {:optional true} [:maybe :string]]
              [:reason       {:optional true} [:enum :no-updates :other]]
              [:valid-until  {:optional true} :any]]]
  (t2/with-transaction [_conn]
    (delete-extra-reviews! (:moderated_item_id params) (:moderated_item_type params))
    (t2/update! ModerationReview {:moderated_item_id   (:moderated_item_id params)
                                  :moderated_item_type (:moderated_item_type params)}
                {:most_recent false})
    (first (t2/insert-returning-instances! ModerationReview (assoc params :most_recent true)))))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; NOTE:


(def verifiable-models
  ;; - Verified means that a `user` confirms the content adheres to business definitions and is actively maintained.
  ;;   Flagged means there is something wrong with it (and tells why). Nothing means it wasn't explicitly
  ;;   verified (might or might not work).

  ;; - Can be applied to: dashboards, questions, and models.

  ;; - Is set manually and can have an expiration date.
  #{:dashboard
    :card
    :model ;; card with type = :model
    })


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;


(def healthyness-models
  ;; - Healthy means the data is good and passing automated data tests. Unhealthy means something is wrong (and tells
  ;;   why). Neutral means there aren't tests, but it is also not broken.

  ;; - Can be applied to: databases, schemas, tables, and models.

  ;; - It operates in a cascading effect. If a database is unhealthy, all underlying schemas, tables, and models are
  ;;   also unhealthy.

  ;; - Can be set automatically (by a data test) or manually (by a user).
  #{:database
    :schema
    :table
    :model ;; card with type = :model
    })


;; to keep track of the most recent statuses

;; database
;; |- schema (lives on table)
;;    |- table
;;       |- card (questions and models)
;;          |- dashboard

(defn upstream*
  "Finds 'upstream' entities for a given model.
   This is used to flow healthyness through the system.
   If any entities upstream of the model are unhealthy, the then the "
  [model-type id]
  (case model-type
    :model/Database []
    :model/Table (mapv (fn [db-id] [:model/Database db-id])
                       (distinct (map :db_id (t2/select [:model/Table :db_id] id))))
    :model/Card (mapv (fn [db-id] [:model/Table db-id])
                      (distinct (map :table_id (t2/select [:model/Card :table_id] id))))
    :model/Dashboard (mapv
                      (fn [db-id] [:model/Card db-id])
                      (map :card_id
                           (t2/query {:select [:dashcard.card_id :dashcard.dashboard_id]
                                      :from   [[:report_dashboardcard :dashcard]]
                                      :join   [[:report_card :card] [:= :dashcard.card_id :card.id]]
                                      :where [:= :dashcard.dashboard_id 10]})))))


(comment
  (upstream* :model/Database 1)
  ;; => []

  (upstream* :model/Table 5)
  ;; => [[:model/Database 1]]

  (upstream* :model/Card 1)
  ;; => [[:model/Table 5]]

  (upstream* :model/Dashboard 10)
  ;; => [[:model/Card 10]]

(defn upstream
  ([model-type id]
   (upstream model-type id #{}))
  ([model-type id seen]
   (loop [queue (upstream* model-type id)
          seen seen]
     (if (empty? queue)
       seen
       (let [[m id] (first queue)]
         (if (contains? seen [m id])
           (recur (rest queue) seen)
           (recur (into (rest queue) (upstream* m id ))
                  (conj seen [m id]))))))))

(upstream :model/Dashboard 10)

;; => ([:model/Dashboard 10] [:model/Card 10] [:model/Table 5] [:model/Database 1])

  ;; TODO: downstream

  (map
   (fn [[m id]] (upstream* m id))
   (upstream* :model/Dashboard 10)))
