import { t } from "ttag";
import type {
  ClickActionBase,
  Drill,
} from "metabase/visualizations/types/click-actions";
import type { Dispatch } from "metabase-types/store";
import type * as Lib from "metabase-lib";

const ACTIONS: Record<
  Lib.SummarizeColumnDrillThruOperator,
  Omit<ClickActionBase, "name">
> = {
  sum: {
    title: t`Sum`,
    section: "sum",
    buttonType: "token",
  },
  avg: {
    title: t`Avg`,
    section: "sum",
    buttonType: "token",
  },
  distinct: {
    title: t`Distinct values`,
    section: "sum",
    buttonType: "token",
  },
};

export const summarizeColumnDrill: Drill<Lib.SummarizeColumnDrillThruInfo> = ({
  drill,
  drillDisplayInfo,
  applyDrill,
}) => {
  const { aggregations } = drillDisplayInfo;

  return aggregations.map(operator => ({
    name: operator,
    ...ACTIONS[operator],
    question: () => applyDrill(drill, operator).setDefaultDisplay(),
    action: () => (dispatch: Dispatch) =>
      // HACK: drill through closes sidebars, so open sidebar asynchronously
      setTimeout(() => dispatch({ type: "metabase/qb/EDIT_SUMMARY" })),
  }));
};
