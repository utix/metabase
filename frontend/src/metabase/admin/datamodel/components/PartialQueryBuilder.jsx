/* eslint-disable react/prop-types */
import PropTypes from "prop-types";
import { Component } from "react";
import { connect } from "react-redux";
import { t } from "ttag";
import _ from "underscore";

import Link from "metabase/core/components/Link";
import Tables from "metabase/entities/tables";
import * as Urls from "metabase/lib/urls";
import { getMetadata } from "metabase/selectors/metadata";
import * as Lib from "metabase-lib";
import { getSegmentOrMetricQuestion } from "metabase-lib/queries/utils/segments";

import withTableMetadataLoaded from "../hoc/withTableMetadataLoaded";

import { GuiQueryEditor } from "./GuiQueryEditor";

class PartialQueryBuilder extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    table: PropTypes.object,
    updatePreviewSummary: PropTypes.func.isRequired,
    previewSummary: PropTypes.string,
  };

  componentDidMount() {
    const { value, table } = this.props;
    if (table && value != null) {
      this.props.updatePreviewSummary({
        type: "query",
        database: table.db_id,
        query: {
          ...value,
          "source-table": table.id,
        },
      });
    }
  }

  setQuery = query => {
    const datasetQuery = Lib.toLegacyQuery(query);
    this.props.onChange(datasetQuery.query);
    this.props.updatePreviewSummary(datasetQuery);
  };

  render() {
    const { features, value, metadata, table, previewSummary } = this.props;

    const question = getSegmentOrMetricQuestion(value, table, metadata);
    const query = question.query();
    const previewUrl = Urls.serializedQuestion(question.card());

    return (
      <div className="py1">
        <GuiQueryEditor
          query={query}
          stageIndex={-1}
          metadata={metadata}
          features={features}
          setQuery={this.setQuery}
          isShowingDataReference={false}
          supportMultipleAggregations={false}
          canChangeTable={this.props.canChangeTable}
        >
          <div className="flex align-center mx2 my2">
            <span className="text-bold px3">{previewSummary}</span>
            <Link
              to={previewUrl}
              target={window.OSX ? null : "_blank"}
              rel="noopener noreferrer"
              className="Button Button--primary"
            >{t`Preview`}</Link>
          </div>
        </GuiQueryEditor>
      </div>
    );
  }
}

export default _.compose(
  Tables.load({
    id: (state, props) => props.value && props.value["source-table"],
    wrapped: true,
  }),
  withTableMetadataLoaded,
  connect((state, props) => ({ metadata: getMetadata(state) })),
)(PartialQueryBuilder);
