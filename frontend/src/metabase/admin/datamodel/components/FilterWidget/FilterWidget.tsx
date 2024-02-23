import { useState } from "react";

import { color } from "metabase/lib/colors";
import ViewPill from "metabase/query_builder/components/view/ViewPill";
import { FilterPicker } from "metabase/querying";
import { Popover } from "metabase/ui";
import * as Lib from "metabase-lib";

type Props = {
  query: Lib.Query;
  stageIndex: number;
  filter: Lib.FilterClause;
  updateFilter: (
    filter: Lib.FilterClause,
    newFilter: Lib.FilterClause | Lib.ExpressionClause | Lib.SegmentMetadata,
  ) => void;
  removeFilter: (filter: Lib.FilterClause) => void;
};

/**
 * @deprecated use MLv2
 */
export function FilterWidget({
  query,
  stageIndex,
  filter,
  updateFilter,
  removeFilter,
}: Props) {
  const [isOpened, setIsOpened] = useState(false);
  const filterInfo = Lib.displayInfo(query, stageIndex, filter);

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
          color={color("filter")}
          onClick={() => setIsOpened(!isOpened)}
          onRemove={() => removeFilter(filter)}
        >
          {filterInfo.displayName}
        </ViewPill>
      </Popover.Target>
      <Popover.Dropdown>
        <FilterPicker
          query={query}
          stageIndex={stageIndex}
          filter={filter}
          onSelect={newFilter => updateFilter(filter, newFilter)}
          onClose={() => setIsOpened(false)}
        />
      </Popover.Dropdown>
    </Popover>
  );
}
