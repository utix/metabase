import { t } from "ttag";

import { Box, Flex } from "metabase/ui";

import { isLastMetricStage } from "../lib/metrics";
import type { NotebookStepUiComponentProps } from "../types";

import { AggregateStep } from "./AggregateStep";
import BreakoutStep from "./BreakoutStep";

function SummarizeStep({
  step,
  color,
  isLastOpened,
  ...props
}: NotebookStepUiComponentProps) {
  const isMetricCalculation = isLastMetricStage(step);

  return (
    <Flex
      align="center"
      direction={{ base: "column", md: "row" }}
      gap={isMetricCalculation ? "md" : "sm"}
    >
      <Box w={{ base: "100%", md: "50%" }}>
        <AggregateStep
          step={step}
          color={color}
          isLastOpened={isLastOpened}
          {...props}
        />
      </Box>
      {!isMetricCalculation && <Box c={color} fw="bold">{t`by`}</Box>}
      <Box w={{ base: "100%", md: "50%" }}>
        <BreakoutStep
          step={step}
          color={color}
          isLastOpened={false}
          {...props}
        />
      </Box>
    </Flex>
  );
}

// eslint-disable-next-line import/no-default-export -- deprecated usage
export default SummarizeStep;
