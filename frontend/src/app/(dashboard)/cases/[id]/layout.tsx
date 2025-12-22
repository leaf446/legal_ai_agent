/**
 * Case Detail Layout
 * Server Component that exports generateStaticParams for static export compatibility
 */

// Required for static export with dynamic routes
// Returns empty array since case IDs are dynamic and fetched at runtime
export function generateStaticParams() {
  return [];
}

export default function CaseDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
