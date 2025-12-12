/**
 * Relationship Visualization Page
 * Displays person relationship graph for a case
 */

import RelationshipClient from './RelationshipClient';

// Allow dynamic routes not listed in generateStaticParams
export const dynamicParams = true;

// Pre-render placeholder routes for static export
export function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }, { id: '3' }];
}

interface PageProps {
  params: { id: string };
}

export default function RelationshipPage({ params }: PageProps) {
  return <RelationshipClient caseId={params.id} />;
}
