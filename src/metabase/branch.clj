(ns metabase.branch
  (:require    [clojure.tools.logging :as log]
               [clojure.walk :as walk]
               [editscript.core :as edit]
               [editscript.edit :as ee]
               [toucan2.core :as t2]
               [toucan2.instance :as instance]
               [toucan2.protocols :as protocols]))

(def *mode-enabled? (atom false))

(def edits
  ;; map of [model id] -> edits

  ;; this shape has models and their edits should be per <user-id X development-mode-revision>
  ;; but for now, we're just using a single development-mode-revision for all users.

  {
   ;; what model and id to apply edits to:
   [:model/Card 88]
   [[[:name] :r "Card Two"]
    [[:dataset_query :query :limit] :r 3]]

   ;; TODO: this can be collapsed handled with data from the Card above.
   [:metadata/card 88]
   [[[:name] :r "Card Two"]
    ;; n.b. these must have -'s not _'s. :death:
    [[:dataset-query :query :limit] :r 3]],

   [:model/Dashboard 9]
   ;; the edit script sequence of edits to apply:
   [

    ;; this one means: `:r`eplace the value at [:name] with "DevMode Dash"
    [[:name] :r "DevMode Dash"]
    ;; Might seem un-needed, but if you start removing items from vectors, this library helps a lot.

    ;; delete the first card:
    ;;[[:dashcards 0] :-]

    ;; let's try adding another dashcard now
    [[:dashcards 0] :+ {:size_x 24,
                        :dashboard_tab_id nil,
                        :series [],
                        :action_id nil,
                        :collection_authority_level nil,
                        :card {:query_average_duration nil},
                        :updated_at #t "2024-04-12T18:36:55.089520Z",
                        :col 0,
                        :id "we made it up",
                        :parameter_mappings [],
                        :card_id nil,
                        :entity_id "8Ts_eIGyx0OEYJFFm5UCv",
                        :visualization_settings
                        {:dashcard.background false,
                         :virtual_card {:name nil,
                                        :dataset_query {},
                                        :display "heading",
                                        :visualization_settings {},
                                        :archived false},
                         :text "Dev Mode Heading!"},
                        :size_y 1,
                        :t2/model :model/DashboardCard,
                        :dashboard_id 9,
                        :created_at #t "2024-04-11T21:53:25.109682Z",
                        :row 10}]

    [[:dashcards 1 :card :dataset_query :query :limit] :r 3]

    ]})


(defn <-instanced [m]
  (walk/postwalk (fn [x] (cond
                           (sequential? x) (vec x)
                           (instance/instance? x) (assoc (into {} x) :t2/model (protocols/model x))
                           :else x))
                 m))

(defn ->instanced [m]
  (walk/postwalk (fn [x]
                   (if (and (map? x) (:t2/model x))
                     (let [model (:t2/model x)] (t2/instance model (dissoc x :t2/model)))
                     x))
                 m))

(defn- model-or-type [x]
  (log/fatal (pr-str [:MOT [(or
                             (protocols/model x)
                             (and (map? x) (:lib/type x))) x]]))
  (or
   (protocols/model x)
   (and (map? x) (:lib/type x))))

;; (model-or-type (t2/select-one :metadata/card 88))

(defn projection
  "Handles the projection of an instance to the view one would see during dev mode."
  ;; note: to get this working we would need to have a way to "save" updates in dev mode as editscript edits.
  [instance]
  (let [model (model-or-type instance)
        {:keys [id] :as m} (<-instanced instance)]
    (log/fatal "DOING PROJECTION on:" (pr-str [model id]))
    (->instanced
     (if-let [edits-to-apply (get edits [model id])]
       (do
         (def m m)
         (def edits-to-apply edits-to-apply)
         (when (= id 88)
           (log/fatal "Found edits:" (pr-str edits-to-apply))
           (log/fatalf "applying edits to %s - %s" model id )
           (log/fatal "input:" (pr-str m))
           (log/fatal "output:" (pr-str (edit/patch m (ee/edits->script edits-to-apply)))))
         (edit/patch m (ee/edits->script edits-to-apply)))
       instance))))

;; (edit/patch {:dashcards [{}]} (ee/edits->script [[[:dashcards 0 :name] :r "Card Zero"]]))


(defn maybe-do-projection [instance]
  (if @*mode-enabled?
    (projection instance)
    instance))

(defn- vectorize
  "Standardize the list-haver to have vectors only."
  [list-haver]
  (walk/postwalk
   (fn [x] (if (sequential? x) (vec x) x))
   list-haver))

;; cards on dashboard
(defn maybe-project-dashboard
  "If branch mode is enabled, project cards in the dashboard shape."
  [dashboard-shape]
  (def dashboard-shape dashboard-shape)
  (if @*mode-enabled?
    ;; project all instances found in the dashboard shape:
    (walk/postwalk
     (fn [x] (if (instance/instance? x) (projection x) x))
     (vectorize dashboard-shape))
    dashboard-shape))



(comment

  (comment (def d dashboard-shape))

  d

  ;; change dashboard, re-record it:

  (comment (def d' dashboard-shape))

  d'

  ;; editscript doesn't work with t2 instances (think we can make it, tho. but skipping it for now)
  (edits/diff (<-instanced d) (<-instanced dashboard-shape))

  )



(comment


  [(get-in
    (t2/select-one :model/Card 88)
    [:dataset_query :query :limit])

   (get-in
    (t2/select-one :metadata/card 88)
    [:dataset-query :query :limit])]
;; => [21 21]

  [(get-in
    (maybe-do-projection (t2/select-one :model/Card 88))
    [:dataset_query :query :limit])

   (get-in
    (maybe-do-projection (t2/select-one :metadata/card 88))
    [:dataset-query :query :limit])]
;; => [3 3]


  )
