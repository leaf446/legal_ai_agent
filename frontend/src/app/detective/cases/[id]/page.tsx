'use client';

/**
 * Detective Investigation Detail Page - Client Component
 * 003-role-based-ui Feature - US5 (T103)
 *
 * Client component wrapper for static export with SPA fallback.
 */

import { useParams } from 'next/navigation';
import DetectiveCaseDetailClient from './DetectiveCaseDetailClient';

export default function DetectiveCaseDetailPage() {
  const params = useParams();
  const id = params?.id as string || '';

  return <DetectiveCaseDetailClient caseId={id} />;
}
