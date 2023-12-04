import type { Drill } from "metabase/visualizations/types";
import type * as Lib from "metabase-lib";

export const zoomInTimeseriesDrill: Drill<Lib.ZoomTimeseriesDrillThruInfo> = ({
  drill,
  drillInfo,
  applyDrill,
}) => {
  const { displayName } = drillInfo;

  return [
    {
      name: "timeseries-zoom",
      title: displayName,
      section: "zoom",
      icon: "zoom_in",
      buttonType: "horizontal",
      question: () => applyDrill(drill).setDefaultDisplay(),
    },
  ];
};
