'use client';

/**
 * RoleGuard Component
 * Provides role-based access control for protected routes
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { UserRole } from '@/types/user';
import { logger } from '@/lib/logger';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
  loadingComponent?: React.ReactNode;
}

export function RoleGuard({
  children,
  allowedRoles,
  fallbackPath = '/login',
  loadingComponent,
}: RoleGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { role, hasRole, homePath } = useRole();

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      logger.info('RoleGuard: User not authenticated, redirecting to login');
      router.replace(fallbackPath);
      return;
    }

    if (!hasRole(allowedRoles)) {
      logger.warn('RoleGuard: User lacks required role', {
        userRole: role,
        allowedRoles,
      });
      router.replace(homePath);
    }
  }, [
    authLoading,
    isAuthenticated,
    hasRole,
    allowedRoles,
    role,
    homePath,
    fallbackPath,
    router,
  ]);

  if (authLoading) {
    return (
      loadingComponent || (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      )
    );
  }

  if (!isAuthenticated || !hasRole(allowedRoles)) {
    return null;
  }

  return <>{children}</>;
}

export default RoleGuard;
