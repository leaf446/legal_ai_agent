/**
 * Dashboard Layout
 * Server Component wrapper that prevents static prerendering
 */

import DashboardLayoutClient from '@/components/layout/DashboardLayoutClient';

// Prevent static prerendering for all dashboard routes
export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
