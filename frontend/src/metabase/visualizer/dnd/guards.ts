import type { Active } from "@dnd-kit/core";

import type {
  DraggedColumn,
  DraggedItem,
  DraggedVizSettingColumn,
} from "metabase-types/store/visualizer";

import { DRAGGABLE_ID } from "./constants";

type DndItem = Omit<Active, "rect">;

export function isDraggedColumnItem(item: DndItem): item is DraggedColumn {
  return item.data?.current?.type === DRAGGABLE_ID.COLUMN;
}

export function isDraggedVizSettingColumnItem(
  item: DndItem,
): item is DraggedVizSettingColumn {
  return item.data?.current?.type === DRAGGABLE_ID.VIZ_SETTING_COLUMN;
}

export function isValidDraggedItem(item: DndItem): item is DraggedItem {
  return isDraggedColumnItem(item) || isDraggedVizSettingColumnItem(item);
}
