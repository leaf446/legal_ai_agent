/**
 * Legacy Case Detail Page - Role-based Redirect
 *
 * This page is deprecated. Users are redirected to their role-specific case detail:
 * - lawyer → /lawyer/cases/{id}
 * - client → /client/cases/{id}
 * - detective → /detective/cases/{id}
 * - admin/staff → /lawyer/cases/{id} (default)
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/user';

interface PageProps {
  params: { id: string };
}

export default function LegacyCaseDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const caseId = params.id;

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Redirect to role-specific case detail page
    if (user) {
      const role = user.role as UserRole;
      let targetPath: string;

      switch (role) {
        case 'lawyer':
          targetPath = `/lawyer/cases/${caseId}`;
          break;
        case 'client':
          targetPath = `/client/cases/${caseId}`;
          break;
        case 'detective':
          targetPath = `/detective/cases/${caseId}`;
          break;
        case 'admin':
        case 'staff':
        default:
          targetPath = `/lawyer/cases/${caseId}`;
          break;
      }

      router.replace(targetPath);
    }
  }, [isAuthenticated, isLoading, router, user, caseId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
        <div className="text-gray-500">리다이렉트 중...</div>
      </div>
    </div>
  );
}
