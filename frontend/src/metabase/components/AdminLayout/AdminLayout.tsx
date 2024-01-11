import AdminHeader from "metabase/components/AdminHeader";

interface AdminLayoutProps {
  title: string;
  sidebar: React.ReactNode;
  children: React.ReactNode;
  saveStatusRef?: React.RefObject<any>;
}

import { AdminWrapper, AdminMain, AdminContent } from "./AdminLayout.styled";

export function AdminLayout({
  title,
  sidebar,
  children,
  saveStatusRef,
}: AdminLayoutProps) {
  return (
    <AdminWrapper>
      <AdminHeader saveStatusRef={saveStatusRef} title={title} />
      <AdminMain className="MetadataEditor-main flex flex-row flex-full mt2">
        {sidebar}
        <AdminContent className="px2 full">{children}</AdminContent>
      </AdminMain>
    </AdminWrapper>
  );
}
