/* eslint-disable react/prop-types */
import { FilterWidget } from "../FilterWidget";

/**
 * @deprecated use MLv2
 */
export function FilterWidgetList({
  query,
  stageIndex,
  filters,
  updateFilter,
  removeFilter,
}) {
  return (
    <div className="Query-filterList ml2 scroll-x scroll-show">
      {filters.map((filter, index) => (
        <FilterWidget
          key={index}
          query={query}
          stageIndex={stageIndex}
          filter={filter}
          updateFilter={updateFilter}
          removeFilter={removeFilter}
        />
      ))}
    </div>
  );
}
