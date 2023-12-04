import { t } from "ttag";
import { zoomInRow } from "metabase/query_builder/actions";
import type { Drill } from "metabase/visualizations/types/click-actions";
import type * as Lib from "metabase-lib";

export const zoomDrill: Drill<Lib.ZoomDrillThruInfo> = ({
  drill,
  drillInfo,
  clicked,
  applyDrill,
}) => {
  const dashboard = clicked?.extraData?.dashboard;
  const { objectId, isManyPks } = drillInfo;

  return [
    {
      name: "object-detail",
      section: "details",
      title: t`View details`,
      buttonType: "horizontal",
      icon: "expand",
      default: true,
      ...(dashboard
        ? { question: () => applyDrill(drill, objectId) }
        : { action: () => zoomInRow({ objectId }) }),
      ...(isManyPks ? { extra: () => ({ objectId }) } : {}),
    },
  ];
};
