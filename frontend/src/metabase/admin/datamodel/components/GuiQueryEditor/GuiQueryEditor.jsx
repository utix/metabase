/* eslint-disable react/prop-types */
/* eslint-disable react/no-string-refs */
import cx from "classnames";
import PropTypes from "prop-types";
import { Component, createRef } from "react";
import ReactDOM from "react-dom";
import { t } from "ttag";

import IconBorder from "metabase/components/IconBorder";
import { DatabaseSchemaAndTableDataSelector } from "metabase/query_builder/components/DataSelector";
import { Icon } from "metabase/ui";
import * as Lib from "metabase-lib";

import { AggregationWidget } from "../AggregationWidget";
import { FilterWidget } from "../FilterWidget";

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
    const clauses = Lib.filters(query, stageIndex);

    if (!features.filter) {
      return;
    }

    return (
      <div className={cx("Query-section")}>
        <div className="Query-filters">
          {clauses.map((clause, clauseIndex) => (
            <FilterWidget
              key={clauseIndex}
              query={query}
              stageIndex={stageIndex}
              clause={clause}
              onUpdate={newClause =>
                setQuery(
                  Lib.replaceClause(query, stageIndex, clause, newClause),
                )
              }
              onRemove={() =>
                setQuery(Lib.removeClause(query, stageIndex, clause))
              }
            />
          ))}
        </div>
        <div className="mx2">
          <FilterWidget
            query={query}
            stageIndex={stageIndex}
            onAdd={newClause =>
              setQuery(Lib.filter(query, stageIndex, newClause))
            }
          />
        </div>
      </div>
    );
  }

  renderAggregation() {
    const { query, stageIndex, features, setQuery } = this.props;
    const clauses = Lib.aggregations(query, stageIndex);

    if (!features.aggregation) {
      return;
    }

    return (
      <div>
        {clauses.map((clause, clauseIndex) => (
          <AggregationWidget
            key={clauseIndex}
            query={query}
            stageIndex={stageIndex}
            clause={clause}
            onUpdate={newClause =>
              setQuery(Lib.replaceClause(query, stageIndex, clause, newClause))
            }
          />
        ))}
        <AggregationWidget
          query={query}
          stageIndex={stageIndex}
          onAdd={newClause =>
            setQuery(Lib.aggregate(query, stageIndex, newClause))
          }
        />
      </div>
    );
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
      <div className="GuiBuilder-section GuiBuilder-filtered-by flex align-center">
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
      <div className="GuiBuilder-section GuiBuilder-view flex align-center px1 pr2">
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
