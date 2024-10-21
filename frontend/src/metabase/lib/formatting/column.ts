import { getFriendlyName } from "metabase/visualizations/lib/utils";
import type { DatasetColumn } from "metabase-types/api/dataset";
import * as Lib from "metabase-lib";

import { capitalize } from "./strings";

export function formatColumn(column: DatasetColumn): string {
  if (!column) {
    return "";
  } else if (column.remapped_to_column != null) {
    // remapped_to_column is a special field added by Visualization.jsx
    return formatColumn(column.remapped_to_column);
  } else {
    // let columnTitle = getFriendlyName(column);
    return Lib.displayNameAttempt(column)
    // if (column.unit && column.unit !== "default") {
    //   columnTitle += ": " + capitalize(column.unit.replace(/-/g, " ")) + "XiX";
    // }
    // return columnTitle;
  }
}
