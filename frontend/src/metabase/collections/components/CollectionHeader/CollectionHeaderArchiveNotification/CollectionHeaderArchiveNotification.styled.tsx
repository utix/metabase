import styled from "@emotion/styled";
import Alert from "metabase/core/components/Alert";
import { Table } from "metabase/collections/components/BaseItemsTable.styled";

export const ArchiveAlert = styled(Alert)`
  & > div {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
`;

export const ArchiveTable = styled(Table)`
  margin-bottom: 2.5rem;
`;
