import { assocIn, getIn } from "icepick";
import _ from "underscore";

import { updateSettings } from "../../visualizer.slice";
import { DROPPABLE_ID } from "../constants";
import { isDraggedColumnItem, isDraggedVizSettingColumnItem } from "../guards";

import type { VizDropHandlerOpts } from "./types";

export function pivotDropHandler({
  event,
  settings,
  dispatch,
}: VizDropHandlerOpts) {
  const { active, over } = event;

  if (over && isDraggedColumnItem(active)) {
    const { column } = active.data.current;
    if (over.id === DROPPABLE_ID.PIVOT_COLUMNS_WELL) {
      const columns = settings["pivot_table.column_split"]?.columns ?? [];
      const hasColumn = columns.some(fieldRef =>
        _.isEqual(fieldRef, column.field_ref),
      );
      dispatch(
        updateSettings({
          "pivot_table.column_split": {
            ...settings["pivot_table.column_split"],
            columns: hasColumn ? columns : [...columns, column.field_ref],
          },
        }),
      );
    } else if (over.id === DROPPABLE_ID.PIVOT_ROWS_WELL) {
      const rows = settings["pivot_table.column_split"]?.rows ?? [];
      const hasColumn = rows.some(fieldRef =>
        _.isEqual(fieldRef, column.field_ref),
      );
      dispatch(
        updateSettings({
          "pivot_table.column_split": {
            ...settings["pivot_table.column_split"],
            rows: hasColumn ? rows : [...rows, column.field_ref],
          },
        }),
      );
    } else if (over.id === DROPPABLE_ID.PIVOT_VALUES_WELL) {
      const values = settings["pivot_table.column_split"]?.values ?? [];
      const hasColumn = values.some(fieldRef =>
        _.isEqual(fieldRef, column.field_ref),
      );
      dispatch(
        updateSettings({
          "pivot_table.column_split": {
            ...settings["pivot_table.column_split"],
            values: hasColumn ? values : [...values, column.field_ref],
          },
        }),
      );
    }
  }

  if (isDraggedVizSettingColumnItem(active)) {
    if (!over || over.id === DROPPABLE_ID.CANVAS_MAIN) {
      const { column, vizSettingKey } = active.data.current;
      const propertyPath = Array.isArray(vizSettingKey)
        ? vizSettingKey
        : [vizSettingKey];

      const fieldRefs = getIn(settings, propertyPath);

      if (fieldRefs.length > 1) {
        const nextFieldRefs = fieldRefs.filter(
          (fieldRef: any) => !_.isEqual(fieldRef, column.field_ref),
        );

        const nextSettings = assocIn(settings, propertyPath, nextFieldRefs);
        const key = Array.isArray(vizSettingKey)
          ? vizSettingKey[0]
          : vizSettingKey;

        dispatch(updateSettings({ [key]: nextSettings[key] }));
      }
    }
  }
}
