import { type Active, useDraggable, useDroppable } from "@dnd-kit/core";
import { type ReactNode, forwardRef, useMemo } from "react";
import _ from "underscore";

import { useSelector } from "metabase/lib/redux";
import { isNotNull } from "metabase/lib/types";
import { type BoxProps, Flex, Stack, Text } from "metabase/ui";
import type { ComputedVisualizationSettings } from "metabase/visualizations/types";
import { DRAGGABLE_ID, DROPPABLE_ID } from "metabase/visualizer/dnd/constants";
import { isDraggedColumnItem } from "metabase/visualizer/dnd/guards";
import { getVisualizerRawSeries } from "metabase/visualizer/visualizer.slice";
import type {
  DatasetColumn,
  FieldReference,
  RawSeries,
} from "metabase-types/api";

import { WellItem } from "../WellItem";

interface PivotVerticalWellProps {
  settings: ComputedVisualizationSettings;
}

export function PivotVerticalWell({ settings }: PivotVerticalWellProps) {
  const series = useSelector(getVisualizerRawSeries);

  const droppableColumnsWell = useDroppable({
    id: DROPPABLE_ID.PIVOT_COLUMNS_WELL,
  });
  const droppableValuesWell = useDroppable({
    id: DROPPABLE_ID.PIVOT_VALUES_WELL,
  });
  const droppableRowsWell = useDroppable({ id: DROPPABLE_ID.PIVOT_ROWS_WELL });

  const { cols, rows, values } = useMemo(() => {
    const { columns, rows, values } =
      settings["pivot_table.column_split"] ?? {};
    return {
      cols: findPivotColumns(series, columns),
      rows: findPivotColumns(series, rows),
      values: findPivotColumns(series, values),
    };
  }, [series, settings]);

  if (!series[0]?.data) {
    return null;
  }

  return (
    <Stack mr="lg">
      <WellBox
        isHighlighted={isWellBoxHighlighted(droppableRowsWell)}
        ref={droppableRowsWell.setNodeRef}
      >
        <Text>Rows</Text>
        {rows.map(rowCol => (
          <DraggableWellItem
            key={rowCol.name}
            canDrag={rows.length > 1}
            column={rowCol}
            vizSettingKey={["pivot_table.column_split", "rows"]}
          >
            <Text truncate>{rowCol.display_name}</Text>
          </DraggableWellItem>
        ))}
      </WellBox>
      <WellBox
        isHighlighted={isWellBoxHighlighted(droppableColumnsWell)}
        ref={droppableColumnsWell.setNodeRef}
      >
        <Text>Columns</Text>
        {cols.map(col => (
          <DraggableWellItem
            key={col.name}
            canDrag={cols.length > 1}
            column={col}
            vizSettingKey={["pivot_table.column_split", "columns"]}
          >
            <Text key={col.name} truncate>
              {col.display_name}
            </Text>
          </DraggableWellItem>
        ))}
      </WellBox>
      <WellBox
        isHighlighted={isWellBoxHighlighted(droppableValuesWell)}
        ref={droppableValuesWell.setNodeRef}
      >
        <Text>Measures</Text>
        {values.map(valueCol => (
          <DraggableWellItem
            key={valueCol.name}
            canDrag={values.length > 1}
            column={valueCol}
            vizSettingKey={["pivot_table.column_split", "values"]}
          >
            <Text truncate>{valueCol.display_name}</Text>
          </DraggableWellItem>
        ))}
      </WellBox>
    </Stack>
  );
}

interface WellBoxProps {
  isHighlighted?: boolean;
  children: ReactNode;
}

const WellBox = forwardRef<HTMLDivElement, WellBoxProps>(function WellBox(
  { isHighlighted, children },
  ref,
) {
  const borderColor = isHighlighted
    ? "var(--mb-color-brand)"
    : "var(--mb-color-border)";
  return (
    <Flex
      direction="column"
      bg={
        isHighlighted
          ? "var(--mb-color-brand-light)"
          : "var(--mb-color-bg-light)"
      }
      p="md"
      gap="sm"
      wrap="nowrap"
      style={{
        borderRadius: "var(--default-border-radius)",
        border: `1px solid ${borderColor}`,
        transform: isHighlighted ? "scale(1.025)" : "scale(1)",
        transition:
          "transform 0.2s ease-in-out 0.2s, border-color 0.2s ease-in-out 0.2s, background 0.2s ease-in-out 0.2s",
      }}
      ref={ref}
    >
      {children}
    </Flex>
  );
});

interface DraggableWellItemProps extends BoxProps {
  canDrag: boolean;
  column: DatasetColumn;
  vizSettingKey: string[];
}

function DraggableWellItem({
  canDrag,
  column,
  vizSettingKey,
  ...props
}: DraggableWellItemProps) {
  const { attributes, listeners, isDragging, setNodeRef } = useDraggable({
    id: `${DRAGGABLE_ID.VIZ_SETTING_COLUMN}:${column.name}`,
    data: {
      type: DRAGGABLE_ID.VIZ_SETTING_COLUMN,
      column,
      vizSettingKey,
    },
    disabled: !canDrag,
  });

  return (
    <WellItem
      {...props}
      {...attributes}
      {...listeners}
      style={{
        cursor: canDrag ? "grab" : "default",
        visibility: isDragging ? "hidden" : "visible",
      }}
      ref={setNodeRef}
    />
  );
}

function findPivotColumns(series: RawSeries, fieldRefs: FieldReference[] = []) {
  const [{ data }] = series ?? [];
  if (!data) {
    return [];
  }

  // TODO Replace with something more reasonable than _.isEqual
  return fieldRefs
    .map(fieldRef => data.cols.find(col => _.isEqual(col.field_ref, fieldRef)))
    .filter(isNotNull);
}

function isWellBoxHighlighted({
  active,
  isOver,
}: {
  isOver: boolean;
  active?: Active | null;
}) {
  return Boolean(isOver && active && isDraggedColumnItem(active));
}
