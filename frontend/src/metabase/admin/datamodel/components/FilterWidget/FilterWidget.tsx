import type { ReactNode } from "react";
import { Component } from "react";
import * as React from "react";

import { Popover } from "metabase/ui";
import * as Lib from "metabase-lib";

import { FilterWidgetRoot } from "./FilterWidget.styled";

type FilterWidgetPillProps = {
  children?: ReactNode;
};

export const FilterWidgetPill = ({ children }: FilterWidgetPillProps) => (
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
      {children}
    </div>
  </div>
);

type Props = {
  query: Lib.Query;
  stageIndex: number;
  filter: Lib.FilterClause;
};

type State = {
  isOpen: boolean;
};

/**
 * @deprecated use MLv2
 */
export class FilterWidget extends Component<Props, State> {
  rootRef: React.RefObject<HTMLDivElement>;

  constructor(props: Props) {
    super(props);

    this.state = {
      isOpen: false,
    };

    this.rootRef = React.createRef();
  }

  static defaultProps = {
    maxDisplayValues: 1,
  };

  open = () => {
    this.setState({ isOpen: true });
  };

  close = () => {
    this.setState({ isOpen: false });
  };

  renderFilter() {
    const { query, stageIndex, filter } = this.props;
    const filterInfo = Lib.displayInfo(query, stageIndex, filter);
    return <FilterWidgetPill>{filterInfo.displayName}</FilterWidgetPill>;
  }

  renderPopover() {
    return <div />;
  }

  render() {
    return (
      <FilterWidgetRoot isSelected={this.state.isOpen} ref={this.rootRef}>
        <Popover
          opened={this.state.isOpen}
          trapFocus
          transitionProps={{ duration: 0 }}
          onClose={this.close}
        >
          <Popover.Target>
            <div className="flex justify-center" onClick={this.open}>
              {this.renderFilter()}
            </div>
          </Popover.Target>
          <Popover.Dropdown>{this.renderPopover()}</Popover.Dropdown>
        </Popover>
      </FilterWidgetRoot>
    );
  }
}
