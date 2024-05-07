/* eslint-disable react/prop-types */
import cx from "classnames";
import type { Location } from "history";
import { assoc } from "icepick";
import { Component } from "react";
import type { ConnectedProps } from "react-redux";
import { connect } from "react-redux";
import { push } from "react-router-redux";
import _ from "underscore";

import LoadingAndErrorWrapper from "metabase/components/LoadingAndErrorWrapper";
import ColorS from "metabase/css/core/colors.module.css";
import CS from "metabase/css/core/index.css";
import DashboardS from "metabase/css/dashboard.module.css";
import {
  initialize,
  fetchDashboard,
  fetchDashboardCardData,
  cancelFetchDashboardCardData,
  fetchDashboardCardMetadata,
  setParameterValue,
  setParameterValueToDefault,
} from "metabase/dashboard/actions";
import { getDashboardActions } from "metabase/dashboard/components/DashboardActions";
import { DashboardGridConnected } from "metabase/dashboard/components/DashboardGrid";
import { DashboardTabs } from "metabase/dashboard/components/DashboardTabs";
import { DashboardControls } from "metabase/dashboard/hoc/DashboardControls";
import {
  getDashboardComplete,
  getCardData,
  getSlowCards,
  getParameters,
  getParameterValues,
  getDraftParameterValues,
  getSelectedTabId,
} from "metabase/dashboard/selectors";
import { isActionDashCard } from "metabase/dashboard/utils";
import title from "metabase/hoc/Title";
import { isWithinIframe } from "metabase/lib/dom";
import ParametersS from "metabase/parameters/components/ParameterValueWidget.module.css";
import { setErrorPage } from "metabase/redux/app";
import { getMetadata } from "metabase/selectors/metadata";
import {
  setPublicDashboardEndpoints,
  setEmbedDashboardEndpoints,
} from "metabase/services";
import { PublicMode } from "metabase/visualizations/click-actions/modes/PublicMode";
import type { Dashboard, DashboardId } from "metabase-types/api";
import type { State } from "metabase-types/store";

import EmbedFrame from "../../components/EmbedFrame";

import { DashboardContainer } from "./PublicDashboard.styled";

const mapStateToProps = (state: State) => {
  return {
    metadata: getMetadata(state),
    dashboard: getDashboardComplete(state),
    dashcardData: getCardData(state),
    slowCards: getSlowCards(state),
    parameters: getParameters(state),
    parameterValues: getParameterValues(state),
    draftParameterValues: getDraftParameterValues(state),
    selectedTabId: getSelectedTabId(state),
  };
};

const mapDispatchToProps = {
  initialize,
  fetchDashboard,
  fetchDashboardCardData,
  cancelFetchDashboardCardData,
  fetchDashboardCardMetadata,
  setParameterValue,
  setParameterValueToDefault,

  setErrorPage,
  onChangeLocation: push,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type OwnProps = {
  params: {
    dashboardId?: string;
    uuid?: string;
    token?: string;
  };
  location: Location;
  isFullscreen: boolean;
  isNightMode: boolean;
};

type PublicDashboardProps = OwnProps & ConnectedProps<typeof connector>;

class PublicDashboardInner extends Component<
  PublicDashboardProps,
  { dashboardId: DashboardId }
> {
  constructor(props: PublicDashboardProps) {
    super(props);
    this.state = {
      dashboardId: String(
        this.props.params.dashboardId ||
          this.props.params.uuid ||
          this.props.params.token,
      ),
    };
  }

  _initialize = async () => {
    const {
      initialize,
      fetchDashboard,
      fetchDashboardCardData,
      setErrorPage,
      location,
      params: { uuid, token },
    } = this.props;
    if (uuid) {
      setPublicDashboardEndpoints();
    } else if (token) {
      setEmbedDashboardEndpoints();
    }

    initialize();

    const result = await fetchDashboard({
      dashId: uuid || token,
      queryParams: location.query,
    });

    if (result.error) {
      setErrorPage(result.payload);
      return;
    }

    try {
      if (this.props.dashboard.tabs?.length === 0) {
        await fetchDashboardCardData({ reload: false, clearCache: true });
      }
    } catch (error) {
      console.error(error);
      setErrorPage(error);
    }
  };

  async componentDidMount() {
    this._initialize();
  }

  componentWillUnmount() {
    this.props.cancelFetchDashboardCardData();
  }

  async componentDidUpdate(prevProps: PublicDashboardProps, prevState: { dashboardId: DashboardId }) {
    if (this.state.dashboardId !== prevState.dashboardId) {
      return this._initialize();
    }

    if (!_.isEqual(prevProps.selectedTabId, this.props.selectedTabId)) {
      this.props.fetchDashboardCardData();
      this.props.fetchDashboardCardMetadata();
      return;
    }

    if (!_.isEqual(this.props.parameterValues, prevProps.parameterValues)) {
      this.props.fetchDashboardCardData({ reload: false, clearCache: true });
    }
  }

  getCurrentTabDashcards = () => {
    const { dashboard, selectedTabId } = this.props;
    if (!Array.isArray(dashboard?.dashcards)) {
      return [];
    }
    if (!selectedTabId) {
      return dashboard.dashcards;
    }
    return dashboard.dashcards.filter(
      dashcard => dashcard.dashboard_tab_id === selectedTabId,
    );
  };

  getHiddenParameterSlugs = () => {
    const { parameters } = this.props;
    const currentTabParameterIds = this.getCurrentTabDashcards().flatMap(
      dashcard =>
        dashcard.parameter_mappings?.map(mapping => mapping.parameter_id) ?? [],
    );
    const hiddenParameters = parameters.filter(
      parameter => !currentTabParameterIds.includes(parameter.id),
    );
    return hiddenParameters.map(parameter => parameter.slug).join(",");
  };

  render() {
    const {
      dashboard,
      parameters,
      parameterValues,
      draftParameterValues,
      isFullscreen,
      isNightMode,
      setParameterValueToDefault,
    } = this.props;

    const buttons = !isWithinIframe()
      ? getDashboardActions({ ...this.props, isPublic: true })
      : [];

    const visibleDashcards = (dashboard?.dashcards ?? []).filter(
      dashcard => !isActionDashCard(dashcard),
    );

    return (
      <EmbedFrame
        name={dashboard && dashboard.name}
        description={dashboard && dashboard.description}
        dashboard={dashboard}
        parameters={parameters}
        parameterValues={parameterValues}
        draftParameterValues={draftParameterValues}
        hiddenParameterSlugs={this.getHiddenParameterSlugs()}
        setParameterValue={this.props.setParameterValue}
        setParameterValueToDefault={setParameterValueToDefault}
        enableParameterRequiredBehavior
        actionButtons={
          buttons.length > 0 && <div className={CS.flex}>{buttons}</div>
        }
        dashboardTabs={
          dashboard?.tabs && dashboard.tabs.length > 1 && (
            <DashboardTabs dashboardId={this.state.dashboardId} location={this.props.location} />
          )
        }
      >
        <LoadingAndErrorWrapper
          className={cx({
            [DashboardS.DashboardFullscreen]: isFullscreen,
            [DashboardS.DashboardNight]: isNightMode,
            [ParametersS.DashboardNight]: isNightMode,
            [ColorS.DashboardNight]: isNightMode,
          })}
          loading={!dashboard}
        >
          {() => (
            <DashboardContainer>
              <DashboardGridConnected
                {...this.props}
                dashboard={assoc(dashboard, "dashcards", visibleDashcards)}
                isPublic
                className={CS.spread}
                mode={PublicMode}
                metadata={this.props.metadata}
                navigateToNewCardFromDashboard={() => {}}
              />
            </DashboardContainer>
          )}
        </LoadingAndErrorWrapper>
      </EmbedFrame>
    );
  }
}

export const PublicDashboard = _.compose(
  connect(mapStateToProps, mapDispatchToProps),
  title(({ dashboard }: {dashboard: Dashboard}) => dashboard && dashboard.name),
  DashboardControls,
)(PublicDashboardInner);
