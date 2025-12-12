'use client';

/**
 * Case Relations Page
 * 009-calm-control-design-system
 *
 * Displays the party relations graph for a case using React Flow.
 */

import { useParams } from 'next/navigation';
import CaseRelationsClient from './CaseRelationsClient';

export default function CaseRelationsPage() {
  const params = useParams();
  const id = params?.id as string || '';

  return <CaseRelationsClient caseId={id} />;
}
