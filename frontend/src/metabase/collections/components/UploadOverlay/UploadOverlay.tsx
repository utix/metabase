import { t } from "ttag";

import type { Collection } from "metabase-types/api";
import { Icon } from "metabase/core/components/Icon";
import type Question from "metabase-lib/Question";
import { DragOverlay } from "./UploadOverlay.styled";

export function UploadOverlay({
  isDragActive,
  collection,
  question,
}: {
  isDragActive: boolean;
  collection?: Collection;
  question?: Question;
}) {
  return (
    <DragOverlay isDragActive={isDragActive}>
      <Icon name="upload" size="24" />
      <div>{t`Drop here to upload to ${collection?.name ?? question?.displayName()}`}</div>
    </DragOverlay>
  );
}
