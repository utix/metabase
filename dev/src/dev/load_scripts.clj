(ns dev.load-scripts
  (:require
   [clojure.java.jdbc :as jdbc]
   [metabase.test :as mt]
   [src.dev.add-load :as add-load]))

(defn one-collection-with-n-cards
  "Will returns collection-id"
  [n]
  (into [[:model/Collection {:?/collection-id :id} {}]]
        (repeat n [:model/Card {} {:collection_id :?/collection-id}])))

(comment
  (-> (one-collection-with-n-cards 200)
      add-load/from-script)
  )

(defn n-perm-groups-with-two-users-each [n]
  (mapcat
   (fn [i] [[:model/PermissionsGroup {} {:name (str "group # " i)}] [:model/User {}] [:model/User {}]])
   (range 1 (inc n))))

(comment

  ;; Let's do 80 users in 40 perm groups
  (-> (n-perm-groups-with-two-users-each 40)
      add-load/from-script)

  )

(defn strongly-connected-cards-and-dashboards [{:keys [card-count dashboard-count]}]
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

  (add-load/from-script
   (strongly-connected-cards-and-dashboards
    {:card-count 200 :dashboard-count 1}))


  (->> (add-load/from-script
        (strongly-connected-cards-and-dashboards
         {:card-count 200 :dashboard-count 1}))
       :dash_1
       (format "http://localhost:3000/dashboard/%s"))
  "http://localhost:3000/dashboard/633"

  )
