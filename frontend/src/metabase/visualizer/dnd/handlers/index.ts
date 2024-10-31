import type { VisualizationDisplay } from "metabase-types/api";

import { funnelDropHandler } from "./funnel";
import { pivotDropHandler } from "./pivot";
import type { VizDropHandlerOpts } from "./types";

type VizDropHandler = (opts: VizDropHandlerOpts) => void;

const handlers: Partial<Record<VisualizationDisplay, VizDropHandler>> = {
  funnel: funnelDropHandler,
  pivot: pivotDropHandler,
};

export function handleVisualizerDragEnd(
  display: VisualizationDisplay,
  opts: VizDropHandlerOpts,
) {
  handlers[display]?.(opts);
}
