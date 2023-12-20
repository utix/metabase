import { t } from "ttag";
import { useEffect, useState } from "react";
import { useAsyncFn } from "react-use";

import { Stack, Title, Text, Button, Group } from "metabase/ui";

import Breadcrumbs from "metabase/components/Breadcrumbs";
import LoadingAndErrorWrapper from "metabase/components/LoadingAndErrorWrapper";

import { ApiKeysApi } from "metabase/services";
import { Icon } from "metabase/core/components/Icon";

import type { ApiKey } from "metabase-types/api";

import { CreateApiKeyModal } from "./CreateApiKeyModal";
import { EditApiKeyModal } from "./EditApiKeyModal";
import { DeleteApiKeyModal } from "./DeleteApiKeyModal";

type Modal = null | "create" | "edit" | "delete";

function ApiKeysTable({
  apiKeys,
  setActiveApiKey,
  setModal,
}: {
  apiKeys?: ApiKey[];
  setActiveApiKey: (apiKey: ApiKey) => void;
  setModal: (modal: Modal) => void;
}) {
  return (
    <table className="ContentTable border-bottom" data-testid="api-keys-table">
      <thead>
        <tr>
          <th>{t`Key name`}</th>
          <th>{t`Group`}</th>
          <th>{t`Key`}</th>
          <th>{t`Last Modified By`}</th>
          <th>{t`Last Modified On`}</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {apiKeys?.map(apiKey => (
          <tr key={apiKey.id} className="border-bottom">
            <td className="text-bold">{apiKey.name}</td>
            <td>{apiKey.group_name}</td>
            <td className="text-monospace">{apiKey.masked_key}</td>

            {/* TODO: replace with creator_name */}
            <td>{apiKey.creator_id}</td>

            <td>{apiKey.updated_at}</td>
            <td>
              <Group spacing="md">
                <Icon
                  name="pencil"
                  className="cursor-pointer"
                  onClick={() => {
                    setActiveApiKey(apiKey);
                    setModal("edit");
                  }}
                />
                <Icon
                  name="trash"
                  className="cursor-pointer"
                  onClick={() => {
                    setActiveApiKey(apiKey);
                    setModal("delete");
                  }}
                />
              </Group>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export const ManageApiKeys = () => {
  const [modal, setModal] = useState<Modal>(null);
  const [activeApiKey, setActiveApiKey] = useState<null | ApiKey>(null);

  const [{ value: apiKeys, loading, error }, refreshList] = useAsyncFn(
    (): Promise<ApiKey[]> => ApiKeysApi.list(),
    [],
  );

  const handleClose = () => setModal(null);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  const isTableVisible = loading && !error;
  const isShowingEmptyTable = isTableVisible && apiKeys?.length === 0;

  return (
    <>
      {modal === "create" ? (
        <CreateApiKeyModal onClose={handleClose} refreshList={refreshList} />
      ) : modal === "edit" && activeApiKey ? (
        <EditApiKeyModal
          onClose={handleClose}
          refreshList={refreshList}
          apiKey={activeApiKey}
        />
      ) : modal === "delete" && activeApiKey ? (
        <DeleteApiKeyModal
          apiKey={activeApiKey}
          onClose={handleClose}
          refreshList={refreshList}
        />
      ) : null}
      <Stack pl="md" spacing="lg">
        <Breadcrumbs
          crumbs={[
            [t`Authentication`, "/admin/settings/authentication"],
            [t`API Keys`],
          ]}
        />
        <Group
          align="end"
          position="apart"
          data-testid="api-keys-settings-header"
        >
          <Stack>
            <Title>{t`Manage API Keys`}</Title>
            {!isShowingEmptyTable && (
              <Text color="text.1">{t`Allow users to use the API keys to authenticate their API calls.`}</Text>
            )}
          </Stack>
          <Button
            variant="filled"
            onClick={() => setModal("create")}
          >{t`Create API Key`}</Button>
        </Group>
        <LoadingAndErrorWrapper loading={loading} error={error}>
          <ApiKeysTable
            apiKeys={apiKeys}
            setActiveApiKey={setActiveApiKey}
            setModal={setModal}
          />
          {isShowingEmptyTable && (
            <Stack
              h="40rem" // TODO: how to make this fill only available window height?
              align="center"
              justify="center"
              spacing="sm"
            >
              <Title>{t`No API keys here yet`}</Title>
              <Text color="text.1">{t`Create API keys to programmatically authenticate their API calls.`}</Text>
            </Stack>
          )}
        </LoadingAndErrorWrapper>
      </Stack>
    </>
  );
};
