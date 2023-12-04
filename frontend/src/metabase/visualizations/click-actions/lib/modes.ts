import type Question from "metabase-lib/Question";
import { MODE_TYPE_NATIVE } from "../Mode/constants";
import { NativeMode } from "../modes/NativeMode";
import { DefaultMode } from "../modes/DefaultMode";
import { getModeType, Mode } from "../Mode";
import type { QueryClickActionsMode } from "../../types";

export function getMode(question: Question): Mode | null {
  const queryMode = getQueryMode(question);
  return queryMode ? new Mode(question, queryMode) : null;
}

// TODO [#26836]: remove "any" - unify ClickAction type
export function getQueryMode(
  question: Question,
): QueryClickActionsMode | any | null {
  const mode = getModeType(question);
  if (!mode) {
    return null;
  }

  switch (mode) {
    case MODE_TYPE_NATIVE:
      return NativeMode;

    default:
      return DefaultMode;
  }
}
