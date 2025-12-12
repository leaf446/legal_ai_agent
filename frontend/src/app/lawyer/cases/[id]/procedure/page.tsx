/**
 * Procedure Page
 * T145 - US3: Procedure stage tracking page for a case
 */

import ProcedureClient from './ProcedureClient';

// Allow dynamic routes not listed in generateStaticParams
export const dynamicParams = true;

// Pre-render placeholder routes for static export
export function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }, { id: '3' }];
}

interface PageProps {
  params: { id: string };
}

export default function ProcedurePage({ params }: PageProps) {
  return <ProcedureClient caseId={params.id} />;
}
