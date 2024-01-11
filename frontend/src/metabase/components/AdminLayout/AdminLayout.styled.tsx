import styled from "@emotion/styled";

export const AdminWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

export const AdminMain = styled.div`
  padding: 1rem;
  display: flex;
  flex: 1;
  overflow: hidden;
`;

export const AdminSidebar = styled.div`
  flex: 0 0 300px;
  overflow: hidden;
  border-right: 1px solid ${props => props.theme.colors.border};
`;

export const AdminContent = styled.div`
  flex: 1;
  overflow: auto;
`;
