/**
 * Case Relations Page
 * 009-calm-control-design-system
 *
 * Displays the party relations graph for a case using React Flow.
 */

import CaseRelationsClient from './CaseRelationsClient';

// Allow dynamic routes not listed in generateStaticParams
export const dynamicParams = true;

// Pre-render placeholder routes for static export
export function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }, { id: '3' }];
}

interface PageProps {
  params: { id: string };
}

export default function CaseRelationsPage({ params }: PageProps) {
  return <CaseRelationsClient caseId={params.id} />;
}
