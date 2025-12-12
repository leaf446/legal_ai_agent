'use client';

/**
 * Case Assets Page
 * 009-calm-control-design-system
 *
 * Asset division management for divorce cases.
 */

import { useParams } from 'next/navigation';
import CaseAssetsClient from './CaseAssetsClient';

export default function CaseAssetsPage() {
  const params = useParams();
  const id = params?.id as string || '';

  return <CaseAssetsClient caseId={id} />;
}
