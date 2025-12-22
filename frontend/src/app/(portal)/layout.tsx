/**
 * Portal Layout
 * Prevents static prerendering for portal routes
 */

// Prevent static prerendering for portal routes
export const dynamic = 'force-dynamic';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
