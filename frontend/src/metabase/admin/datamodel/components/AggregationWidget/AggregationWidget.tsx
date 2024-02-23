import { useState } from "react";

import { AggregationPicker } from "metabase/common/components/AggregationPicker";
import { color } from "metabase/lib/colors";
import ViewPill from "metabase/query_builder/components/view/ViewPill";
import { Popover } from "metabase/ui";
import * as Lib from "metabase-lib";

type Props = {
  query: Lib.Query;
  stageIndex: number;
  clause?: Lib.AggregationClause;
  onAdd?: (newClause: Lib.Aggregable) => void;
  onUpdate?: (newClause: Lib.Aggregable) => void;
};

/**
 * @deprecated use MLv2
 */
export function AggregationWidget({
  query,
  stageIndex,
  clause,
  onAdd,
  onUpdate,
}: Props) {
  const [isOpened, setIsOpened] = useState(false);
  const clauseInfo = clause ? Lib.displayInfo(query, stageIndex, clause) : null;
  const baseOperators = Lib.availableAggregationOperators(query, stageIndex);
  const operators = clause
    ? Lib.selectedAggregationOperators(baseOperators, clause)
    : baseOperators;

  return (
    <Popover
      opened={isOpened}
      position="bottom-start"
      transitionProps={{ duration: 0 }}
      trapFocus
      onClose={() => setIsOpened(false)}
    >
      <Popover.Target>
        <ViewPill
          color={color("aggregation")}
          onClick={() => setIsOpened(!isOpened)}
        >
          {clauseInfo?.displayName}
        </ViewPill>
      </Popover.Target>
      <Popover.Dropdown>
        <AggregationPicker
          query={query}
          stageIndex={stageIndex}
          clause={clause}
          operators={operators}
          onSelect={newClause => {
            if (clause) {
              onUpdate?.(newClause);
            } else {
              onAdd?.(newClause);
            }
          }}
          onClose={() => setIsOpened(false)}
        />
      </Popover.Dropdown>
    </Popover>
  );
}
