'use client';

/**
 * Client Case Detail Page - Client Component
 * 003-role-based-ui Feature - US4 (T075)
 *
 * Client component wrapper for static export with SPA fallback.
 */

import { useParams } from 'next/navigation';
import ClientCaseDetailClient from './ClientCaseDetailClient';

export default function ClientCaseDetailPage() {
  const params = useParams();
  const id = params?.id as string || '';

  return <ClientCaseDetailClient caseId={id} />;
}
