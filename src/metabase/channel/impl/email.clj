(ns metabase.channel.impl.email
  (:require
   [buddy.core.codecs :as codecs]
   [cheshire.core :as json]
   [hiccup.core :refer [html]]
   [metabase.channel.core :as channel]
   [metabase.channel.params :as channel.params]
   [metabase.channel.shared :as channel.shared]
   [metabase.email :as email]
   [metabase.email.messages :as messages]
   [metabase.email.result-attachment :as email.result-attachment]
   [metabase.models.channel :as models.channel]
   [metabase.models.notification :as models.notification]
   [metabase.public-settings :as public-settings]
   [metabase.pulse.core :as pulse]
   [metabase.util :as u]
   [metabase.util.encryption :as encryption]
   [metabase.util.i18n :refer [trs]]
   [metabase.util.log :as log]
   [metabase.util.malli :as mu]
   [metabase.util.malli.schema :as ms]
   [metabase.util.markdown :as markdown]
   [metabase.util.urls :as urls]
   [stencil.core :as stencil]))

(def ^:private EmailMessage
  [:map
   [:subject                         :string]
   [:recipients                      [:sequential ms/Email]]
   [:message-type                    [:enum :attachments :html :text]]
   [:message                         :any]
   [:recipient-type {:optional true} [:maybe (ms/enum-keywords-and-strings :cc :bcc)]]])

(defn- construct-email
  ([subject recipients message]
   (construct-email subject recipients message nil))
  ([subject recipients message recipient-type]
   {:subject        subject
    :recipients     recipients
    :message-type   :attachments
    :message        message
    :recipient-type recipient-type}))

(defn- recipients->emails
  [recipients]
  (update-vals
   {:user-emails     (mapv (comp :email :user) (filter #(= :user (:kind %)) recipients))
    :non-user-emails (mapv :email (filter #(= :external-email (:kind %)) recipients))}
   #(filter u/email? %)))

;; ------------------------------------------------------------------------------------------------;;
;;                                           Alerts                                                ;;
;; ------------------------------------------------------------------------------------------------;;

(defn- find-goal-value
  "The goal value can come from a progress goal or a graph goal_value depending on it's type"
  [card]
  (case (:display card)

    (:area :bar :line)
    (get-in card [:visualization_settings :graph.goal_value])

    :progress
    (get-in card [:visualization_settings :progress.goal])

    nil))

(mu/defmethod channel/send! :channel/email
  [_channel {:keys [subject recipients message-type message recipient-type]} :- EmailMessage]
  (email/send-message-or-throw! {:subject      subject
                                 :recipients   recipients
                                 :message-type message-type
                                 :message      message
                                 :bcc?         (if recipient-type
                                                 (= :bcc recipient-type)
                                                 (email/bcc-enabled?))}))

;; shared between alert and dash sub
(defn generate-dashboard-sub-unsubscribe-hash
  "Generates hash to allow for non-users to unsubscribe from pulses/subscriptions."
  [pulse-id email]
  (codecs/bytes->hex
   (encryption/validate-and-hash-secret-key
    (json/generate-string {:salt     (public-settings/site-uuid-for-unsubscribing-url)
                           :email    email
                           :pulse-id pulse-id}))))

(defn- unsubscribe-url-for-non-user
  [dashboard-subscription-id non-user-email]
  (str (urls/unsubscribe-url)
       "?hash=" (generate-dashboard-sub-unsubscribe-hash dashboard-subscription-id non-user-email)
                "&email=" non-user-email
                "&pulse-id=" dashboard-subscription-id))

(defn- part-attachments [parts]
  (filter some? (mapcat email.result-attachment/result-attachment parts)))

(defn- render-part
  [timezone part options]
  (case (:type part)
    :card
    (pulse/render-pulse-section timezone part options)

    :text
    {:content (markdown/process-markdown (:text part) :html)}

    :tab-title
    {:content (markdown/process-markdown (format "# %s\n---" (:text part)) :html)}))

(defn- render-body
  [{:keys [details] :as _template} payload]
  (case (keyword (:type details))
    :email/mustache-resource
    (stencil/render-file (:path details) payload)
    :email/mustache-text
    (stencil/render-string (:body details) payload)
    (do
     (log/warnf "Unknown email template type: %s" (:type details))
     nil)))

(defn- render-message-body
  [template message-context attachments]
  (vec (concat [{:type "text/html; charset=utf-8" :content (render-body template message-context)}] attachments)))

(defn- make-message-attachment [[content-id url]]
  {:type         :inline
   :content-id   content-id
   :content-type "image/png"
   :content      url})

(defn- icon-bundle
  "Bundle an icon.

  The available icons are defined in [[js-svg/icon-paths]]."
  [icon-name]
  (let [color     (pulse/primary-color)
        png-bytes (pulse/icon icon-name color)]
    (-> (pulse/make-image-bundle :attachment png-bytes)
        (pulse/image-bundle->attachment))))

(mu/defmethod channel/render-notification [:channel/email :notification/alert] :- [:sequential EmailMessage]
  [_channel-type {:keys [payload] :as notification-payload} template recipients]
  (let [{:keys [result
                alert
                card]}            payload
        {:keys [user-emails
                non-user-emails]} (recipients->emails recipients)
        timezone                  (channel.shared/defaulted-timezone card)
        rendered-card             (render-part timezone result {:pulse/include-title? true})
        goal                      (find-goal-value card)
        icon-attachment           (apply make-message-attachment (icon-bundle :bell))
        message-context           (fn [non-user-email]
                                    (assoc notification-payload
                                           :computed {:subject         (case (messages/pulse->alert-condition-kwd alert)
                                                                         :meets (trs "Alert: {0} has reached its goal" (:name card))
                                                                         :below (trs "Alert: {0} has gone below its goal" (:name card))
                                                                         :rows  (trs "Alert: {0} has results" (:name card)))
                                                      :icon_cid        (:content-id icon-attachment)
                                                      :card_url            (urls/card-url (:id card))
                                                      :alert_content   (html (:content rendered-card))
                                                      :alert_schedule  (messages/alert-schedule-text (:schedule alert))
                                                      :management_text (if (nil? non-user-email)
                                                                         "Manage your subscriptions"
                                                                         "Unsubscribe")
                                                      :alert_condition (get goal (messages/pulse->alert-condition-kwd alert))
                                                      :management_url  (if (nil? non-user-email)
                                                                         (urls/notification-management-url)
                                                                         (unsubscribe-url-for-non-user (:id alert) non-user-email))}))
        attachments               (concat
                                   [icon-attachment (apply make-message-attachment (:attachments rendered-card))]
                                   (part-attachments result))
        email-to-users            (when (> (count user-emails) 0)
                                    (let [message-ctx (message-context nil)]
                                      (def message-ctx message-ctx)
                                      (construct-email
                                       (channel.params/substitute-params (-> template :details :subject) message-ctx)
                                       user-emails
                                       (render-message-body template (message-context nil) attachments))))
        email-to-nonusers         (for [non-user-email non-user-emails]
                                    (let [message-ctx (message-context non-user-email)]
                                      (construct-email
                                       (channel.params/substitute-params (-> template :details :subject) message-ctx)
                                       [non-user-email]
                                       (render-message-body template (message-context non-user-email) attachments))))]
    (filter some? (conj email-to-nonusers email-to-users))))

;; ------------------------------------------------------------------------------------------------;;
;;                                    Dashboard Subscriptions                                      ;;
;; ------------------------------------------------------------------------------------------------;;

(defn- render-filters
  [parameters]
  (let [cells   (map
                 (fn [filter]
                   [:td {:class "filter-cell"
                         :style (pulse/style {:width "50%"
                                              :padding "0px"
                                              :vertical-align "baseline"})}
                    [:table {:cellpadding "0"
                             :cellspacing "0"
                             :width "100%"
                             :height "100%"}
                     [:tr
                      [:td
                       {:style (pulse/style {:color pulse/color-text-medium
                                             :min-width "100px"
                                             :width "50%"
                                             :padding "4px 4px 4px 0"
                                             :vertical-align "baseline"})}
                       (:name filter)]
                      [:td
                       {:style (pulse/style {:color pulse/color-text-dark
                                             :min-width "100px"
                                             :width "50%"
                                             :padding "4px 16px 4px 8px"
                                             :vertical-align "baseline"})}
                       (pulse/value-string filter)]]]])
                 parameters)
        rows    (partition 2 2 nil cells)]
    (html
     [:table {:style (pulse/style {:table-layout :fixed
                                   :border-collapse :collapse
                                   :cellpadding "0"
                                   :cellspacing "0"
                                   :width "100%"
                                   :font-size  "12px"
                                   :font-weight 700
                                   :margin-top "8px"})}
      (for [row rows]
        [:tr {} row])])))

(mu/defmethod channel/render-notification [:channel/email :notification/dashboard-subscription] :- [:sequential EmailMessage]
  [_channel-type {:keys [payload dashboard_subscription] :as notification-payload} template recipients]
  (let [{:keys [user-emails
                non-user-emails]}  (recipients->emails recipients)
        email-subject              (channel.params/substitute-params (-> template :details :subject) notification-payload)
        {:keys [result
                parameters
                dashboard]}        payload
        timezone                   (some->> result (some :card) channel.shared/defaulted-timezone)
        rendered-cards             (mapv #(render-part timezone % {:pulse/include-title? true}) result)
        icon-attachment            (apply make-message-attachment (icon-bundle :dashboard))
        filters                    (when parameters
                                     (render-filters parameters))
        attachments               (concat
                                   [icon-attachment]
                                   (map #(apply make-message-attachment %) (map :attachments rendered-cards))
                                   (part-attachments result))
        message-context            (fn [non-user-email]
                                     (assoc notification-payload
                                            :computed {:dashboard_content   (html (vec (cons :div (map :content rendered-cards))))
                                                       :icon_cid            (:content-id icon-attachment)
                                                       :dashboard_url       (pulse/dashboard-url (:id dashboard) parameters)
                                                       :dashboard_has_tabs? (some-> dashboard :tabs seq)
                                                       :management_text     (if (nil? non-user-email)
                                                                              "Manage your subscriptions"
                                                                              "Unsubscribe")
                                                       :management_url      (if (nil? non-user-email)
                                                                              (urls/notification-management-url)
                                                                              (unsubscribe-url-for-non-user (:id dashboard_subscription) non-user-email))
                                                       :filters            filters}))
        email-to-users             (when (seq user-emails)
                                     (construct-email
                                      email-subject
                                      user-emails
                                      (render-message-body template (message-context nil) attachments)))
        email-to-nonusers          (for [non-user-email non-user-emails]
                                     (construct-email
                                      email-subject
                                      [non-user-email]
                                      (render-message-body template (message-context non-user-email) attachments)))]
    (filter some? (conj email-to-nonusers email-to-users))))

;; ------------------------------------------------------------------------------------------------;;
;;                                         System Events                                           ;;
;; ------------------------------------------------------------------------------------------------;;

(defn- notification-recipients->emails
  [recipients notification-payload]
  (into [] cat (for [recipient recipients
                     :let [details (:details recipient)
                           emails (case (:type recipient)
                                    :notification-recipient/user
                                    [(-> recipient :user :email)]
                                    :notification-recipient/group
                                    (->> recipient :permissions_group :members (map :email))
                                    :notification-recipient/external-email
                                    [(:email details)]
                                    :notification-recipient/template
                                    [(not-empty (channel.params/substitute-params (:pattern details) notification-payload :ignore-missing? (:is_optional details)))]
                                    nil)]
                     :let  [emails (filter some? emails)]
                     :when (seq emails)]
                 emails)))

(mu/defmethod channel/render-notification
  [:channel/email :notification/system-event]
  [_channel-type
   notification-payload #_:- #_notification/NotificationPayload
   template             :- models.channel/ChannelTemplate
   recipients           :- [:sequential models.notification/NotificationRecipient]]
  (assert (some? template) "Template is required for system event notifications")
  [(construct-email (channel.params/substitute-params (-> template :details :subject) notification-payload)
                    (notification-recipients->emails recipients notification-payload)
                    [{:type    "text/html; charset=utf-8"
                      :content (render-body template notification-payload)}]
                    (-> template :details :recipient-type keyword))])
