// TODO: handle the weird spacing at the top of collections

import { useState } from "react";
import _ from "underscore";
import { useAsyncRetry } from "react-use";
import Questions from "metabase/entities/questions";
import { getUserIsAdmin } from "metabase/selectors/user";
import { useDispatch, useSelector } from "metabase/lib/redux";
import { CollectionsApi } from "metabase/services";
import { Flex, Text, Button, Modal } from "metabase/ui";
import { ArchiveAlert } from "./CollectionHeaderArchiveNotification.styled";
import { getItemId, getItemIds } from "./utils";
import type { Item } from "./utils";
import { CollectionHeaderArchiveNotificationTable } from "./CollectionHeaderArchiveNotificationTable";

export const CollectionHeaderArchiveNotification = () => {
  const dispatch = useDispatch();

  const isAdmin = useSelector(getUserIsAdmin);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const {
    loading,
    error,
    value: items = [],
    retry,
  } = useAsyncRetry(async () => {
    if (!isAdmin) {
      return [];
    }
    // TODO: update & type new response
    const response = (await CollectionsApi.getAutoArchive()) as Item[];
    // TODO: shouldn't have to dedupe
    const items = _.uniq(response, getItemId);
    setSelectedIds(getItemIds(items));
    return items;
  });

  if (!isAdmin || error || loading) {
    return null;
  }

  const handleArchive = () => {
    items.forEach(item => {
      if (selectedIds.has(getItemId(item))) {
        if (item.model === "card") {
          dispatch(Questions.actions.setArchived({ id: item.id }, true));
        }
      }
    });
    await retry();
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedIds(getItemIds(items));
  };

  return (
    <>
      <ArchiveAlert icon="archive" variant="info" className="mt1">
        <Text>
          {/* TODO: how to translate values that have singular or plural nouns */}
          {`You have ${items.length} ${
            items.length === 1 ? "item" : "items"
          } that have not been used for the last 6 months. Do you want to archive them?`}
        </Text>
        <Button variant="filled" onClick={() => setIsOpen(true)}>
          View items
        </Button>
      </ArchiveAlert>
      <Modal
        title="Here are the items your team hasn't used in the past 6 months"
        padding="xl"
        size="xl"
        opened={isOpen}
        onClose={handleClose}
      >
        {loading ? (
          <div>Loading...</div>
        ) : (
          <CollectionHeaderArchiveNotificationTable
            selectedIds={selectedIds}
            items={items}
            onSelectIdsChange={setSelectedIds}
          />
        )}
        <Flex justify="flex-end">
          <Button variant="outline" onClick={} className="mr2">
            Cancel
          </Button>
          <Button variant="filled" onClick={handleArchive}>
            Archive items
          </Button>
        </Flex>
      </Modal>
    </>
  );
};
