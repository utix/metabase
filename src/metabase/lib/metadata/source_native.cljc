(ns metabase.lib.metadata.source-native
  (:require
   [metabase.lib.metadata.protocols :as lib.metadata.protocols]))

(deftype SourceNativeMetadataProvider [metadata-provider db-id query columns]
  lib.metadata.protocols/MetadataProvider
  (database [_this]
    (lib.metadata.protocols/database metadata-provider))
  (metadatas [_this metadata-type ids]
    (if (= metadata-type :metadata/card)
      (let [hacked-ids (filter neg? ids)
            normal-ids (remove neg? ids)]
        (-> []
            (into (map (fn [id]
                         {:archived false
                          :view_count 0
                          :table_id 250
                          :result_metadata columns
                          :database_id db-id
                          :enable_embedding false
                          :query_type :query
                          :name "synthetic card"
                          :type :question
                          :creator_id 3
                          :dataset_query {:database db-id, :type :native, :native {:query query}}
                          :id id
                          :parameter_mappings []
                          :display :scalar
                          :archived_directly false
                          :collection_preview true
                          :visualization_settings {}
                          :parameters []}))
                  hacked-ids)
            (into (lib.metadata.protocols/metadatas metadata-provider metadata-type normal-ids))))
      (lib.metadata.protocols/metadatas metadata-provider metadata-type ids)))
  (tables [_this]
    (lib.metadata.protocols/tables metadata-provider))
  (metadatas-for-table [_this metadata-type table-id]
    (lib.metadata.protocols/metadatas-for-table metadata-provider metadata-type table-id))
  (metadatas-for-card [_this metadata-type card-id]
    (lib.metadata.protocols/metadatas-for-card metadata-provider metadata-type card-id))
  (setting [_this setting-key]
    (lib.metadata.protocols/setting metadata-provider setting-key)))

(defn source-native-metadata-provider
  ([metadata-provider
    {:keys [database], {:keys [source-native]} :query}]
   (->SourceNativeMetadataProvider metadata-provider database (:query source-native) (:metadata source-native)))
  ([metadata-provider db-id query columns]
   (->SourceNativeMetadataProvider metadata-provider db-id query columns)))

(defn source-native-metadata
  [^SourceNativeMetadataProvider source-native-provider]
  (.-columns source-native-provider))
