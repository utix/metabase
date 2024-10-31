import { Box, type BoxProps, Text } from "metabase/ui";
import { DRAGGABLE_ID } from "metabase/visualizer/dnd/constants";
import type { DraggedItem } from "metabase-types/store/visualizer";

import { ColumnListItem } from "../DataManager";
import { WellItem } from "../VisualizationCanvas/WellItem";

interface DragOverlayProps {
  item: DraggedItem;
}

export function DragOverlay({ item }: DragOverlayProps) {
  if (item.data.current.type === DRAGGABLE_ID.COLUMN) {
    return (
      <DragOverlayWrapper
        style={{ borderRadius: "var(--default-border-radius)" }}
      >
        <ColumnListItem column={item.data.current.column} />
      </DragOverlayWrapper>
    );
  }
  if (item.data.current.type === DRAGGABLE_ID.VIZ_SETTING_COLUMN) {
    return (
      <DragOverlayWrapper style={{ borderRadius: "var(--border-radius-xl)" }}>
        <WellItem>
          <Text truncate>{item.data.current.column.display_name}</Text>
        </WellItem>
      </DragOverlayWrapper>
    );
  }
  return null;
}

function DragOverlayWrapper({ style, ...props }: BoxProps) {
  return (
    <Box
      {...props}
      bg="#F8FBFE"
      style={{
        ...style,
        border: "2px solid #358CD9",
        boxShadow: "0px 1px 4px 1px rgba(0, 0, 0, 0.2)",
        cursor: "grab",
      }}
    />
  );
}
