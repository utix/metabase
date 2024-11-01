import { Tooltip as MantineTooltip, type TooltipProps } from "@mantine/core";
export type { TooltipProps } from "@mantine/core";
export { getTooltipOverrides } from "./Tooltip.styled";

export const Tooltip = (props: TooltipProps) => {
  const { withinPortal = true, opened } = props;
  return (
    <MantineTooltip
      {...props}
      withinPortal={
        // To avoid z-index issues, don't create a portal if the tooltip is not opened
        opened && withinPortal
      }
    />
  );
};
