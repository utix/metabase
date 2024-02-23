import type { ReactNode } from "react";
import { useState } from "react";

import { color } from "metabase/lib/colors";
import ViewPill from "metabase/query_builder/components/view/ViewPill";
import { FilterPicker } from "metabase/querying";
import { Popover } from "metabase/ui";
import * as Lib from "metabase-lib";

type Props = {
  query: Lib.Query;
  stageIndex: number;
  clause?: Lib.FilterClause;
  renderTarget?: (props: TargetProps) => ReactNode;
  onAdd?: (
    newClause: Lib.FilterClause | Lib.SegmentMetadata | Lib.ExpressionClause,
  ) => void;
  onUpdate?: (
    newClause: Lib.FilterClause | Lib.SegmentMetadata | Lib.ExpressionClause,
  ) => void;
  onRemove?: () => void;
};

type TargetProps = {
  onClick: () => void;
};

/**
 * @deprecated use MLv2
 */
export function FilterWidget({
  query,
  stageIndex,
  clause,
  renderTarget,
  onAdd,
  onUpdate,
  onRemove,
}: Props) {
  const [isOpened, setIsOpened] = useState(false);
  const clauseInfo = clause ? Lib.displayInfo(query, stageIndex, clause) : null;

  return (
    <Popover
      opened={isOpened}
      position="bottom-start"
      transitionProps={{ duration: 0 }}
      trapFocus
      onClose={() => setIsOpened(false)}
    >
      <Popover.Target>
        {renderTarget ? (
          renderTarget({ onClick: () => setIsOpened(!isOpened) })
        ) : (
          <ViewPill
            color={color("filter")}
            onClick={() => setIsOpened(!isOpened)}
            onRemove={onRemove}
          >
            {clauseInfo?.displayName}
          </ViewPill>
        )}
      </Popover.Target>
      <Popover.Dropdown>
        <FilterPicker
          query={query}
          stageIndex={stageIndex}
          filter={clause}
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
