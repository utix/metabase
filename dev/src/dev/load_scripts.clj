(ns dev.load-scripts
  (:require
   #_:clj-kondo/ignore
   [clojure.java.jdbc :as jdbc]
   [metabase.test :as mt]
   [src.dev.add-load :as add-load]))

(defn one-collection-with-n-cards
  "Will returns collection-id"
  [n]
  (into [[:model/Collection {:?/collection-id :id} {}]]
        (repeat n [:model/Card {} {:collection_id :?/collection-id}])))

(comment

  (one-collection-with-n-cards 3)

  (->> (one-collection-with-n-cards 20)
       add-load/from-script
       :collection-id
       (str "http://localhost:3000/collection/"))

  )

(defn n-perm-groups-with-two-users-each
  "Generates script which makes N permission groups, each with 2 brand new users"
  [n]
  (vec
   (mapcat
    (fn [i] [[:model/PermissionsGroup {:?/group-id :id} {:name (str "group # " i " " (rand))}]
             [:model/User {:?/user-one :id} {}]
             [:model/User {:?/user-two :id} {}]
             [:model/PermissionsGroupMembership {} {:user_id :?/user-one :group_id :?/group-id}]
             [:model/PermissionsGroupMembership {} {:user_id :?/user-two :group_id :?/group-id}]])
    (range 1 (inc n)))))

(comment

  (n-perm-groups-with-two-users-each 2)

  ;; Let's do 80 users in 40 perm groups
  (-> (n-perm-groups-with-two-users-each 40)
      add-load/from-script)

  )

(defn strongly-connected-cards-and-dashboards
  "Generates script with card-count cards and dashboard-count dashboards, and puts each card on each dashboard."
  [{:keys [card-count dashboard-count]}]
  (let [cards (mapv (fn [i] [:model/Card
                             {(keyword "?" (str "card_" i)) :id}
                             {:name (str "Card " i)
                              :type          :question
                              ;; I hope we can get away from this state leaking in:
                              :dataset_query (mt/mbql-query users)}])
                    (range 1 (inc card-count)))
        dashboards (mapv (fn [i] [:model/Dashboard {(keyword "?" (str "dash_" i)) :id} {:name (str "Dashboard" i)}])
                         (range 1 (inc dashboard-count)))
        dashcards (for [[_ c _] cards
                        [_ d _] dashboards
                        :let [card-id (first (keys c))]
                        :let [dash-id (first (keys d))]]
                    [:model/DashboardCard {} {:card_id card-id :dashboard_id dash-id :size_x 12 :size_y 6}])]
    (concat cards dashboards dashcards)))

(comment

  (strongly-connected-cards-and-dashboards
    {:card-count 2 :dashboard-count 1})

  (add-load/from-script
   (strongly-connected-cards-and-dashboards
    {:card-count 200 :dashboard-count 1}))


  (->> (add-load/from-script
        (strongly-connected-cards-and-dashboards
         {:card-count 200 :dashboard-count 1}))
       :dash_1
       (format "http://localhost:3000/dashboard/%s"))





  )
