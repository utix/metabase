import {
  MODE_TYPE_DEFAULT,
  MODE_TYPE_NATIVE,
} from "metabase/visualizations/click-actions/Mode/constants";
import type Question from "metabase-lib/Question";
import type { ModeType } from "./types";

export function getModeType(question: Question): ModeType | null {
  if (!question) {
    return null;
  }
  return question.isNative() ? MODE_TYPE_NATIVE : MODE_TYPE_DEFAULT;
}
