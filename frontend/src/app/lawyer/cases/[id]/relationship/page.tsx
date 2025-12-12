'use client';

/**
 * Relationship Visualization Page
 * Displays person relationship graph for a case
 */

import { useParams } from 'next/navigation';
import RelationshipClient from './RelationshipClient';

export default function RelationshipPage() {
  const params = useParams();
  const id = params?.id as string || '';

  return <RelationshipClient caseId={id} />;
}
