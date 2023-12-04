import type { QueryClickActionsMode } from "../../types";
import { NativeQueryClickFallback } from "../actions/NativeQueryClickFallback";
import { DefaultMode } from "./DefaultMode";

export const NativeMode: QueryClickActionsMode = {
  name: "native",
  hasDrills: false,
  clickActions: DefaultMode.clickActions,
  fallback: NativeQueryClickFallback,
};
