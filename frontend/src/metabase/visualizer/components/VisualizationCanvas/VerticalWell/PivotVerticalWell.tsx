import { useDroppable } from "@dnd-kit/core";
import { type ReactNode, forwardRef, useMemo } from "react";
import _ from "underscore";

import { useSelector } from "metabase/lib/redux";
import { isNotNull } from "metabase/lib/types";
import { Box, type BoxProps, Flex, Stack, Text } from "metabase/ui";
import type { ComputedVisualizationSettings } from "metabase/visualizations/types";
import { DROPPABLE_ID } from "metabase/visualizer/dnd/constants";
import { getVisualizerRawSeries } from "metabase/visualizer/visualizer.slice";
import type { FieldReference, RawSeries } from "metabase-types/api";

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

  return (
    <Stack mr="lg">
      <WellBox ref={droppableRowsWell.setNodeRef}>
        <Text>Rows</Text>
        {rows.map(rowCol => (
          <WellItem key={rowCol.name}>
            <Text truncate>{rowCol.display_name}</Text>
          </WellItem>
        ))}
      </WellBox>
      <WellBox ref={droppableColumnsWell.setNodeRef}>
        <Text>Columns</Text>
        {cols.map(col => (
          <WellItem key={col.name}>
            <Text key={col.name} truncate>
              {col.display_name}
            </Text>
          </WellItem>
        ))}
      </WellBox>
      <WellBox ref={droppableValuesWell.setNodeRef}>
        <Text>Measures</Text>
        {values.map(valueCol => (
          <WellItem key={valueCol.name}>
            <Text truncate>{valueCol.display_name}</Text>
          </WellItem>
        ))}
      </WellBox>
    </Stack>
  );
}

const WellBox = forwardRef<HTMLDivElement, { children: ReactNode }>(
  function WellBox({ children }, ref) {
    return (
      <Flex
        direction="column"
        bg="var(--mb-color-bg-light)"
        p="md"
        gap="sm"
        wrap="nowrap"
        style={{
          borderRadius: "var(--default-border-radius)",
          border: `1px solid var(--mb-color-border)`,
        }}
        ref={ref}
      >
        {children}
      </Flex>
    );
  },
);

function WellItem(props: BoxProps) {
  return (
    <Box
      {...props}
      bg="var(--mb-color-bg-white)"
      px="sm"
      style={{
        borderRadius: "var(--border-radius-xl)",
        border: `1px solid var(--mb-color-border)`,
        boxShadow: "0 0 1px var(--mb-color-shadow)",
      }}
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
