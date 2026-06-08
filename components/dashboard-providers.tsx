"use client";

import { SessionTimeoutDialog } from "@/components/session-timeout-dialog";

export function DashboardProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <SessionTimeoutDialog />
    </>
  );
}
