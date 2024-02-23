/* eslint-disable react/prop-types */
/* eslint-disable react/no-string-refs */
import cx from "classnames";
import PropTypes from "prop-types";
import { Component, createRef } from "react";
import ReactDOM from "react-dom";
import { t } from "ttag";

import IconBorder from "metabase/components/IconBorder";
import { DatabaseSchemaAndTableDataSelector } from "metabase/query_builder/components/DataSelector";
import { FilterPicker } from "metabase/querying";
import { Icon, Popover } from "metabase/ui";
import * as Lib from "metabase-lib";

import { AggregationWidget } from "../AggregationWidget";
import { FilterWidgetList } from "../FilterWidgetList";

/**
 * @deprecated use MLv2
 */
export class GuiQueryEditor extends Component {
  constructor(props) {
    super(props);

    this.filterPopover = createRef();
    this.guiBuilder = createRef();
  }

  state = {
    expanded: true,
    isFilterPopoverOpened: false,
  };

  static propTypes = {
    query: PropTypes.object.isRequired,
    stageIndex: PropTypes.number.isRequired,
    metadata: PropTypes.object.isRequired,
    setQuery: PropTypes.func.isRequired,
    features: PropTypes.object,
    supportMultipleAggregations: PropTypes.bool,
    isShowingDataReference: PropTypes.bool.isRequired,
  };

  static defaultProps = {
    features: {
      filter: true,
      aggregation: true,
      breakout: true,
      sort: true,
      limit: true,
    },
    supportMultipleAggregations: true,
  };

  renderAdd(text, onClick, targetRefName) {
    const className =
      "AddButton text-light text-bold flex align-center text-medium-hover cursor-pointer no-decoration transition-color";
    if (onClick) {
      return (
        <a className={className} onClick={onClick}>
          {text && <span className="mr1">{text}</span>}
          {this.renderAddIcon(targetRefName)}
        </a>
      );
    } else {
      return (
        <span className={className}>
          {text && <span className="mr1">{text}</span>}
          {this.renderAddIcon(targetRefName)}
        </span>
      );
    }
  }

  renderAddIcon(targetRefName) {
    return (
      <IconBorder borderRadius="3px" ref={targetRefName}>
        <Icon name="add" />
      </IconBorder>
    );
  }

  renderFilters() {
    const { query, stageIndex, features, setQuery } = this.props;

    if (!features.filter) {
      return;
    }

    let enabled;
    let filterList;
    let addFilterButton;

    const { isEditable } = Lib.queryDisplayInfo(query);

    if (isEditable) {
      enabled = true;

      const filters = Lib.filters(query, stageIndex);
      if (filters && filters.length > 0) {
        filterList = (
          <FilterWidgetList
            query={query}
            stageIndex={stageIndex}
            filters={filters}
            updateFilter={(filter, newFilter) =>
              setQuery(Lib.replaceClause(query, stageIndex, filter, newFilter))
            }
            removeFilter={filter =>
              setQuery(Lib.removeClause(query, stageIndex, filter))
            }
          />
        );
      }

      addFilterButton = this.renderAdd(
        filterList ? null : t`Add filters to narrow your answer`,
        () => this.setState({ isFilterPopoverOpened: true }),
        "addFilterTarget",
      );
    } else {
      enabled = false;
      addFilterButton = this.renderAdd(
        t`Add filters to narrow your answer`,
        null,
        "addFilterTarget",
      );
    }

    return (
      <div className={cx("Query-section", { disabled: !enabled })}>
        <div className="Query-filters">{filterList}</div>
        <div className="mx2">
          <Popover
            opened={this.state.isFilterPopoverOpened}
            position="bottom-start"
            transitionProps={{ duration: 0 }}
            trapFocus
            onClose={() => this.setState({ isFilterPopoverOpened: false })}
          >
            <Popover.Target>{addFilterButton}</Popover.Target>
            <Popover.Dropdown>
              <FilterPicker
                query={query}
                stageIndex={stageIndex}
                onSelect={filter =>
                  setQuery(Lib.filter(query, stageIndex, filter))
                }
                onClose={() => this.setState({ isFilterPopoverOpened: false })}
              />
            </Popover.Dropdown>
          </Popover>
        </div>
      </div>
    );
  }

  renderAggregation() {
    const { query, legacyQuery, features, supportMultipleAggregations } =
      this.props;
    const { isEditable } = Lib.queryDisplayInfo(query);

    if (!features.aggregation) {
      return;
    }
    // aggregation clause.  must have table details available
    if (isEditable) {
      const aggregations = [...legacyQuery.aggregations()];

      if (aggregations.length === 0) {
        // add implicit rows aggregation
        aggregations.push(["rows"]);
      }

      // Placeholder aggregation for showing the add button
      if (supportMultipleAggregations && !legacyQuery.isBareRows()) {
        aggregations.push(null);
      }

      const aggregationList = [];
      for (const [index, aggregation] of aggregations.entries()) {
        aggregationList.push(
          <AggregationWidget
            className="QueryOption p1"
            key={"agg" + index}
            aggregation={aggregation}
            query={legacyQuery}
            onChangeAggregation={aggregation =>
              aggregation
                ? console.error(
                    legacyQuery.updateAggregation(index, aggregation),
                  )
                : console.error(legacyQuery.removeAggregation(index))
            }
            showMetrics={false}
            showRawData
          >
            {this.renderAdd(null)}
          </AggregationWidget>,
        );
        if (
          aggregations[index + 1] != null &&
          aggregations[index + 1].length > 0
        ) {
          aggregationList.push(
            <span key={"and" + index} className="text-bold">{t`and`}</span>,
          );
        }
      }
      return aggregationList;
    } else {
      // TODO: move this into AggregationWidget?
      return (
        <div className="Query-section Query-section-aggregation disabled">
          <a className="QueryOption p1 flex align-center">{t`Raw data`}</a>
        </div>
      );
    }
  }

  renderDataSection() {
    const { query, stageIndex, metadata, setQuery } = this.props;
    const tableId = Lib.sourceTableOrCardId(query);
    const table = tableId ? Lib.tableOrCardMetadata(query, tableId) : null;
    const tableInfo = table ? Lib.displayInfo(query, stageIndex, table) : null;

    const handleTableChange = (newTableId, newDatabaseId) => {
      const metadataProvider = Lib.metadataProvider(newDatabaseId, metadata);
      const newTable = Lib.tableOrCardMetadata(metadataProvider, newTableId);
      setQuery(Lib.queryFromTableOrCardMetadata(metadataProvider, newTable));
    };

    return (
      <div
        className={
          "GuiBuilder-section GuiBuilder-data flex align-center arrow-right"
        }
      >
        <span className="GuiBuilder-section-label Query-label">{t`Data`}</span>
        {this.props.canChangeTable ? (
          <DatabaseSchemaAndTableDataSelector
            selectedTableId={tableId}
            setSourceTableFn={handleTableChange}
          />
        ) : (
          <span className="flex align-center px2 py2 text-bold text-grey">
            {tableInfo != null && tableInfo.displayName}
          </span>
        )}
      </div>
    );
  }

  renderFilterSection() {
    if (!this.props.features.filter) {
      return;
    }

    return (
      <div
        className="GuiBuilder-section GuiBuilder-filtered-by flex align-center"
        ref={this.filterSection}
      >
        <span className="GuiBuilder-section-label Query-label">{t`Filtered by`}</span>
        {this.renderFilters()}
      </div>
    );
  }

  renderViewSection() {
    const { features } = this.props;
    if (!features.aggregation && !features.breakout) {
      return;
    }

    return (
      <div
        className="GuiBuilder-section GuiBuilder-view flex align-center px1 pr2"
        ref="viewSection"
      >
        <span className="GuiBuilder-section-label Query-label">{t`View`}</span>
        {this.renderAggregation()}
      </div>
    );
  }

  componentDidUpdate() {
    const guiBuilder = this.guiBuilder.current;
    if (!guiBuilder) {
      return;
    }

    // HACK: magic number "5" accounts for the borders between the sections?
    const contentWidth =
      ["data", "filter", "view", "groupedBy", "sortLimit"].reduce(
        (acc, ref) => {
          const node = ReactDOM.findDOMNode(this.refs[`${ref}Section`]);
          return acc + (node ? node.offsetWidth : 0);
        },
        0,
      ) + 5;
    const guiBuilderWidth = guiBuilder.offsetWidth;

    const expanded = contentWidth < guiBuilderWidth;
    if (this.state.expanded !== expanded) {
      this.setState({ expanded });
    }
  }

  render() {
    return (
      <div
        className={cx("GuiBuilder rounded shadowed", {
          "GuiBuilder--expand": this.state.expanded,
        })}
        ref={this.guiBuilder}
      >
        <div className="GuiBuilder-row flex">
          {this.renderDataSection()}
          {this.renderFilterSection()}
        </div>
        <div className="GuiBuilder-row flex flex-full">
          {this.renderViewSection()}
          <div className="flex-full" />
          {this.props.children}
        </div>
      </div>
    );
  }
}
