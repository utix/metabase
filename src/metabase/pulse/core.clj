(ns metabase.pulse.core
  "API namespace for the `metabase.pulse` module."
  (:require
   [metabase.channel.render.preview]
   [metabase.channel.render.core]
   [metabase.channel.render.image-bundle]
   [metabase.channel.render.style]
   [metabase.pulse.send]
   [potemkin :as p]))

(comment
  metabase.pulse.send/keep-me
  metabase.pulse.preview/keep-me
  metabase.channel.render.core/keep-me
  metabase.pulse.render.image-bundle/keep-me
  metabase.pulse.render.style/keep-me)

(p/import-vars
 [metabase.pulse.preview
  render-dashboard-to-html
  style-tag-from-inline-styles
  style-tag-nonce-middleware]
 [metabase.channel.render.core
  detect-pulse-chart-type
  png-from-render-info
  render-pulse-card
  render-pulse-card-for-display
  render-pulse-card-to-base64
  render-pulse-card-to-png
  render-pulse-section]
 [metabase.pulse.render.image-bundle
  image-bundle->attachment
  make-image-bundle]
  ;; TODO -- this stuff is also used by emails, it probably should belong in some sort of common place
 [metabase.pulse.render.style
  color-text-light
  color-text-medium
  color-text-dark
  primary-color
  section-style
  style]
 [metabase.pulse.send
  defaulted-timezone
  send-pulse!])
