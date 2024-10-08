(ns metabase.api.dismissed-modal
  "This is a simple namespace that allows the frontend to cheaply dismiss modals without backend input.

  The idea is that the frontend defines an identifying `key` for this dismissal - for example, maybe
  `collection-cleanup-${colleciton_id}`. All they need to do to see if the modal should be displayed is
  `GET /api/dismissed-modal/collection-cleanup-1`.
  If the modal is dismissed, they can just do `PUT /api/dismissed-modal/collection-cleanup-1`. None of this
  requires working with backend folks, who are (generally) the worst."
  (:require [compojure.core :refer [GET PUT]]
            [metabase.api.common :as api]
            [metabase.models.dismissed-modal :as dismissed-modal]
            [metabase.util.malli.schema :as ms]))

(api/defendpoint PUT "/:key"
  "Dismiss a modal. `key` is an opaque-to-the-backend string."
  [key]
  {key ms/NonBlankString}
  (dismissed-modal/dismiss! api/*current-user-id* key)
  true)

(api/defendpoint GET "/:key"
  "Check whether the user has dismissed this modal."
  [key]
  (dismissed-modal/dismissed? api/*current-user-id* key))

(api/defendpoint DELETE "/:key"
  "Undismiss a modal. Probably mostly for tests."
  [key]
  (dismissed-modal/undismiss! api/*current-user-id* key))

(api/define-routes)
