import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { msgid, ngettext, t } from "ttag";

import { useTempStorage } from "metabase/common/hooks";
import ExternalLink from "metabase/core/components/ExternalLink";
import CS from "metabase/css/core/index.css";
import { getStoreUrl } from "metabase/selectors/settings";
import { Flex, Group, Icon, Text } from "metabase/ui";
import type { TokenStatus } from "metabase-types/api";

export const TrialBanner = ({ tokenStatus }: { tokenStatus: TokenStatus }) => {
  const [lastDismissed, setLastDismissed] = useTempStorage(
    "trial-banner-dismissal-timestamp",
  );
  const [showBanner, setShowBanner] = useState(true);

  const now = dayjs();
  const tokenExpiryDate = dayjs(tokenStatus["valid-thru"]);
  const daysRemaining = tokenExpiryDate.diff(now, "day");
  const lastDay = daysRemaining === 0;

  useEffect(() => {
    if (daysRemaining <= 3) {
      const wasDismissed =
        lastDismissed &&
        lastDismissed > tokenExpiryDate.subtract(daysRemaining, "day").unix();

      setShowBanner(!wasDismissed);
    } else {
      setShowBanner(!lastDismissed);
    }
  }, [daysRemaining, lastDismissed, tokenExpiryDate]);

  const href = getStoreUrl("/account/manage/billing#section=payment-method");

  const handleBannerClose = () => {
    setLastDismissed(now.unix());
    setShowBanner(false);
  };

  return showBanner ? (
    <Flex
      align="center"
      bg="warning"
      h="xl"
      justify="space-between"
      pl="1.325rem"
      pr="md"
    >
      <Group spacing="xs">
        <Icon name="warning_round_filled" w={36} />
        <Text>
          {lastDay
            ? t`Today is the last day of your trial.`
            : ngettext(
                msgid`${daysRemaining} day left in your trial.`,
                `${daysRemaining} days left in your trial.`,
                daysRemaining,
              )}
        </Text>
        <ExternalLink className={CS.textBold} href={href}>
          {t`Manage your subscription.`}
        </ExternalLink>
      </Group>
      <Icon
        className={CS.cursorPointer}
        name="close"
        onClick={handleBannerClose}
        w={36}
      />
    </Flex>
  ) : null;
};
