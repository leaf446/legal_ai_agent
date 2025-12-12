/**
 * Legacy Cases Page - Role-based Redirect
 *
 * This page is deprecated. Users are redirected to their role-specific case list:
 * - lawyer → /lawyer/cases
 * - client → /client/cases
 * - detective → /detective/cases
 * - admin/staff → /lawyer/cases (default)
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/user';

export default function LegacyCasesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Redirect to role-specific cases page
    if (user) {
      const role = user.role as UserRole;
      let targetPath: string;

      switch (role) {
        case 'lawyer':
          targetPath = '/lawyer/cases';
          break;
        case 'client':
          targetPath = '/client/cases';
          break;
        case 'detective':
          targetPath = '/detective/cases';
          break;
        case 'admin':
        case 'staff':
        default:
          targetPath = '/lawyer/cases';
          break;
      }

      router.replace(targetPath);
    }
  }, [isAuthenticated, isLoading, router, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
        <div className="text-gray-500">리다이렉트 중...</div>
      </div>
    </div>
  );
}
