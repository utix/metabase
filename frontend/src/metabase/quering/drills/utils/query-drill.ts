import * as Lib from "metabase-lib";
import type { ClickObject } from "metabase-lib/queries/drills/types";
import type Question from "metabase-lib/Question";
import { DRILLS } from "./constants";

export function queryDrill(question: Question, clicked: ClickObject) {
  const query = question._getMLv2Query();
  const stageIndex = -1;
  const drills = Lib.availableDrillThrus(
    query,
    stageIndex,
    clicked.column,
    clicked.value,
    clicked.data,
    clicked.dimensions,
  );

  const applyDrill = (drill: Lib.DrillThru, ...args: unknown[]) => {
    const newQuery = Lib.drillThru(query, stageIndex, drill, ...args);
    return question._setMLv2Query(newQuery);
  };

  return drills.flatMap(drill => {
    const drillInfo = Lib.displayInfo(query, stageIndex, drill);
    const drillHandler = DRILLS[drillInfo.type];
    return drillHandler({ question, drill, drillInfo, applyDrill });
  });
}
