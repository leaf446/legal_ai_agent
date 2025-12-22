'use client';

/**
 * Role Information Hook
 * Provides role-based utilities and access control helpers
 */

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import {
  UserRole,
  ROLE_DISPLAY_NAMES,
  ROLE_HOME_PATHS,
  isValidRole,
} from '@/types/user';

export interface UseRoleReturn {
  role: UserRole | null;
  displayName: string;
  homePath: string;
  isLawyer: boolean;
  isClient: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isDetective: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

export function useRole(): UseRoleReturn {
  const { user } = useAuth();

  const role = useMemo<UserRole | null>(() => {
    if (!user?.role) return null;
    return isValidRole(user.role) ? user.role : null;
  }, [user?.role]);

  const displayName = useMemo(() => {
    if (!role) return '사용자';
    return ROLE_DISPLAY_NAMES[role];
  }, [role]);

  const homePath = useMemo(() => {
    if (!role) return '/login';
    return ROLE_HOME_PATHS[role];
  }, [role]);

  const isLawyer = role === 'lawyer';
  const isClient = role === 'client';
  const isAdmin = role === 'admin';
  const isStaff = role === 'staff';
  const isDetective = role === 'detective';

  const hasRole = useMemo(() => {
    return (allowedRoles: UserRole[]) => {
      if (!role) return false;
      return allowedRoles.includes(role);
    };
  }, [role]);

  return {
    role,
    displayName,
    homePath,
    isLawyer,
    isClient,
    isAdmin,
    isStaff,
    isDetective,
    hasRole,
  };
}

export default useRole;
