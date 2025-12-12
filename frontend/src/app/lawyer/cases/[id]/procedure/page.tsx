'use client';

/**
 * Procedure Page (Client Component wrapper)
 * T145 - US3: Procedure stage tracking page for a case
 */

import { useParams } from 'next/navigation';
import ProcedureClient from './ProcedureClient';

export default function ProcedurePage() {
  const params = useParams();
  const id = params?.id as string || '';

  return <ProcedureClient caseId={id} />;
}
