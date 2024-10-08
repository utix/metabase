(ns metabase.models.dismissed-modal
  (:require
   [metabase.util.malli :as mu]
   [methodical.core :as methodical]
   [toucan2.core :as t2]))

(methodical/defmethod t2/table-name :model/DismissedModal [_model] :dismissed_modal)

(doto :model/DismissedModal
  (derive :metabase/model)
  (derive :hook/created-at-timestamped?))

(mu/defn dismiss!
  "Upserts a KV-pair"
  [user-id :- :int
   k :- :string]
  (try
    (t2/insert! :model/DismissedModal :user_id user-id :key k)
    ;; this is a little scary. Ideally we would just catch duplicate key exceptions, but due to the large number of
    ;; app DBs we support this isn't really easy - we'd have to go through each possible DB type, see what it throws,
    ;; catch that exception, and keep this updated. If the above clause becomes more complicated, we should
    ;; reconsider, but for right now it's probably ok.
    (catch Exception _
      nil)))

(mu/defn dismissed?
  :- :boolean
  "Retrieves a KV-pair"
  [user-id :- :int
   k :- :string]
  (boolean (t2/exists? :model/DismissedModal :user_id user-id :key k)))

(mu/defn undismiss!
  "Un-dismisses the key"
  [user-id :- :int
   k :- :string]
  (t2/delete! :model/DismissedModal :user_id user-id :key k))
