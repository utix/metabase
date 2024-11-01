import {
  Overlay as MantineOverlay,
  type OverlayProps as MantineOverlayProps,
} from "@mantine/core";
import cx from "classnames";
export { getOverlayOverrides } from "./Overlay.styled";

import ZIndex from "metabase/css/core/z-index.module.css";

export const Overlay = (props: MantineOverlayProps) => {
  return (
    <MantineOverlay
      {...props}
      className={cx(props.className, ZIndex.FloatingElement)}
    />
  );
};

export type OverlayProps = MantineOverlayProps;
