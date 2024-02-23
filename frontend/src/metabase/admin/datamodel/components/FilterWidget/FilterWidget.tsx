import { useState } from "react";

import ViewPill from "metabase/query_builder/components/view/ViewPill";
import { FilterPicker } from "metabase/querying";
import { Popover } from "metabase/ui";
import * as Lib from "metabase-lib";

import { FilterWidgetRoot } from "./FilterWidget.styled";

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
    <FilterWidgetRoot isSelected={isOpened}>
      <Popover
        opened={isOpened}
        trapFocus
        transitionProps={{ duration: 0 }}
        onChange={setIsOpened}
      >
        <Popover.Target>
          <div className="flex justify-center">
            <div className="flex flex-column justify-center">
              <div
                className="flex align-center"
                style={{
                  padding: "0.5em",
                  paddingTop: "0.3em",
                  paddingBottom: "0.3em",
                  paddingLeft: 0,
                }}
              >
                <ViewPill onRemove={() => removeFilter(filter)}>
                  {" "}
                  {filterInfo.displayName}
                </ViewPill>
              </div>
            </div>
          </div>
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
    </FilterWidgetRoot>
  );
}
