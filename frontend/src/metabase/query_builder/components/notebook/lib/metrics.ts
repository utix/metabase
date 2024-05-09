import * as Lib from "metabase-lib";

import type { NotebookStep } from "../types";

export function isLastMetricStage(step: NotebookStep) {
  const isMetric = step.question.type() === "metric";
  const query = Lib.dropEmptyStages(step.query);
  const isLastStage = step.stageIndex === Lib.stageCount(query) - 1;
  return isMetric && isLastStage;
}
