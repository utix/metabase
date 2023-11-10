import type { Drill } from "metabase/visualizations/types/click-actions";
import type { DrillThruType } from "metabase-lib";
import { FKFilterDrill } from "../drills/mlv2/FKFilterDrill";
import { SummarizeColumnByTimeDrill } from "../drills/mlv2/SummarizeColumnByTimeDrill";
import { SortDrill } from "../drills/mlv2/SortDrill";
import { ObjectDetailsFkDrill } from "../drills/mlv2/ObjectDetailsFkDrill";
import { ObjectDetailsPkDrill } from "../drills/mlv2/ObjectDetailsPkDrill";
import { ObjectDetailsZoomDrill } from "../drills/mlv2/ObjectDetailsZoomDrill";

export const MODE_TYPE_DEFAULT = "default";
export const MODE_TYPE_NATIVE = "native";
export const MODE_TYPE_SEGMENT = "segment";
export const MODE_TYPE_METRIC = "metric";
export const MODE_TYPE_TIMESERIES = "timeseries";
export const MODE_TYPE_GEO = "geo";
export const MODE_TYPE_PIVOT = "pivot";

export const MODES_TYPES = [
  MODE_TYPE_NATIVE,
  MODE_TYPE_SEGMENT,
  MODE_TYPE_METRIC,
  MODE_TYPE_TIMESERIES,
  MODE_TYPE_GEO,
  MODE_TYPE_PIVOT,
  MODE_TYPE_DEFAULT,
] as const;

export const DRILL_TYPE_TO_HANDLER_MAP: Record<
  DrillThruType,
  Drill<any> | null
> = {
  "drill-thru/column-filter": null, // ColumnFilterDrill,
  "drill-thru/quick-filter": null, // QuickFilterDrill,
  "drill-thru/pk": ObjectDetailsPkDrill,
  "drill-thru/zoom": ObjectDetailsZoomDrill,
  "drill-thru/fk-details": ObjectDetailsFkDrill,
  "drill-thru/pivot": null,
  "drill-thru/fk-filter": FKFilterDrill,
  "drill-thru/distribution": null, // DistributionDrill,
  "drill-thru/sort": SortDrill,
  "drill-thru/summarize-column": null, // SummarizeColumnDrill,
  "drill-thru/summarize-column-by-time": SummarizeColumnByTimeDrill,
  "drill-thru/underlying-records": null, // UnderlyingRecordsDrill,
  "drill-thru/zoom-in.timeseries": null,
};
