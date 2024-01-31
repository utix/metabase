(ns metabase.api.recent-errors
  (:require [compojure.core :refer [GET]]
            [metabase.api.common :as api]))

(api/defendpoint GET "/recent"
  []
  [{:message "my happy error"}])

(api/define-routes)
