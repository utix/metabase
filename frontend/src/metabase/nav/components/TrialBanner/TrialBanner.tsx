import dayjs from "dayjs";
import { jt, t } from "ttag";

import ExternalLink from "metabase/core/components/ExternalLink";
import CS from "metabase/css/core/index.css";
import { getStoreUrl } from "metabase/selectors/settings";
import { Flex, Group, Icon, Text } from "metabase/ui";
import type { TokenStatus } from "metabase-types/api";

export const TrialBanner = ({ tokenStatus }: { tokenStatus: TokenStatus }) => {
  const daysRemaining = dayjs(tokenStatus?.["valid-thru"]).diff(dayjs(), "day");

  const href = getStoreUrl("/account/manage/billing#section=payment-method");

  const handleBannerClose = () => {
    // update user settings
    // close the banner
  };

  return (
    <Flex
      align="center"
      bg="var(--mb-color-warning)"
      h="xl"
      justify="space-between"
      pl="1.325rem"
      pr="md"
    >
      <Group spacing="xs">
        <Icon name="warning_round_filled" w={36} />
        <Text>
          {jt`${daysRemaining} days left in your trial. ${(
            <ExternalLink
              className={CS.textBold}
              href={href}
              key="store-link"
            >{t`Manage your subscription`}</ExternalLink>
          )}.`}
        </Text>
      </Group>
      <Icon
        className={CS.cursorPointer}
        name="close"
        onClick={handleBannerClose}
        w={36}
      />
    </Flex>
  );
};
