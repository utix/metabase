import Tooltip from "metabase/core/components/Tooltip";
import { color } from "metabase/lib/colors";
import { getRelativeTime } from "metabase/lib/time";
import {
  Button,
  Card,
  Flex,
  Icon,
  Popover,
  SegmentedControl,
  Select,
  Text,
} from "metabase/ui";
import type { ModerationReview, User } from "metabase-types/api";

import { getIconForReview, getModeratorDisplayText } from "../../service";

import { TooltipTime } from "./ModerationReviewIcon.styled";
import { useState } from "react";
import { useEditItemVerificationMutation } from "metabase/api";
import Question from "metabase-lib/v1/Question";

export interface ModerationReviewIconProps {
  review: ModerationReview;
  moderator?: User;
  currentUser: User;
  question: Question;
}

const ModerationReviewIcon = ({
  review,
  moderator,
  currentUser,
  question,
}: ModerationReviewIconProps): JSX.Element => {
  const { name: iconName, color: iconColor } = getIconForReview(review);

  const tooltip = moderator && (
    <div>
      <div>{getModeratorDisplayText(moderator, currentUser)}</div>
      <TooltipTime dateTime={review.created_at}>
        {getRelativeTime(review.created_at)}
      </TooltipTime>
    </div>
  );

  return (
    <Popover width={200} position="bottom" withArrow shadow="md">
      <Popover.Target>
        {/* <Tooltip tooltip={tooltip}> */}
        <Icon name={iconName} color={color(iconColor)} />
        {/* </Tooltip> */}
      </Popover.Target>
      <Popover.Dropdown>
        <ModerationCard review={review} question={question} />
      </Popover.Dropdown>
    </Popover>
  );
};

// eslint-disable-next-line import/no-default-export -- deprecated usage
export default ModerationReviewIcon;

const ModerationCard = ({
  review,
  question,
}: {
  review: ModerationReview;
  question: Question;
}) => {
  console.log(review);
  return review.status ? (
    <ModerationDisplayCard review={review} />
  ) : (
    <ModerationCreateCard question={question} />
  );
};

const ModerationCreateCard = ({ question }: { question: Question }) => {
  const threeMonth = new Date();
  threeMonth.setMonth(threeMonth.getMonth() + 3);
  const sixMonth = new Date();
  sixMonth.setMonth(sixMonth.getMonth() + 6);
  const oneYear = new Date();
  oneYear.setMonth(oneYear.getMonth() + 12);

  const [status, setStatus] = useState<"verified" | "flagged">("verified");
  const [expireyDiff, setExpireyDiff] = useState<number>(3);

  console.log({ status, expireyDiff });

  const [editItemVerification] = useEditItemVerificationMutation();

  const handleSet = () => {
    const today = new Date();
    today.setMonth(today.getMonth() + expireyDiff);

    editItemVerification({
      status,
      valid_until: today.toISOString(),
      moderated_item_id: question.id(),
      moderated_item_type: "card",
    });
  };

  return (
    <Card w="18rem">
      <Text>Set status</Text>
      <SegmentedControl
        mb="1rem"
        value={status}
        onChange={setStatus}
        data={[
          { label: "Verified", value: "verified" },
          { label: "Flagged", value: "flagged" },
        ]}
      />

      <Select
        label="Until"
        mb="1rem"
        value={expireyDiff}
        onChange={setExpireyDiff}
        data={[
          {
            value: 3,
            label: `${threeMonth.toDateString()} (3 months)`,
          },
          {
            value: 6,
            label: `${sixMonth.toDateString()} (6 months)`,
          },
          {
            value: 12,
            label: `${oneYear.toDateString()} (1 year)`,
          },
        ]}
      />
      <Flex justify="end" gap="1rem">
        <Button compact>Cancel</Button>
        <Button compact variant="filled" onClick={handleSet}>
          Set
        </Button>
      </Flex>
    </Card>
  );
};

const ModerationDisplayCard = ({ review }: { review: ModerationReview }) => {
  return (
    <Card>
      <Text>Status set by {review.user.first_name}</Text>
    </Card>
  );
};
