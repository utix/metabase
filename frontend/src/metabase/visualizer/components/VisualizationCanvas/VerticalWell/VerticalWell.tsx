import type { ComputedVisualizationSettings } from "metabase/visualizations/types";
import type { VisualizationDisplay } from "metabase-types/api";

import { FunnelVerticalWell } from "./FunnelVerticalWell";
import { PivotVerticalWell } from "./PivotVerticalWell";

interface VerticalWellProps {
  display: VisualizationDisplay;
  settings: ComputedVisualizationSettings;
}

export function VerticalWell({ display, ...props }: VerticalWellProps) {
  if (display === "funnel") {
    return <FunnelVerticalWell {...props} />;
  }
  if (display === "pivot") {
    return <PivotVerticalWell {...props} />;
  }
  return null;
}
