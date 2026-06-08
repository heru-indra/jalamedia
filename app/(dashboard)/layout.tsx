// src/app/(dashboard)/layout.tsx
import { requireAuth } from "@/lib/auth-helper";
import { SidebarNav } from "@/components/sidebar-nav";
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const user    = session.user;
  return (
    <div className="flex min-h-dvh bg-bg">
      <SidebarNav userName={user.name} userEmail={user.email} userImage={user.image} pricingTier={user.pricingTier??"free"} />
      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}