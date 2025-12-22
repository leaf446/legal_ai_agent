/**
 * User Role Types and Display Names
 */

export type UserRole = 'lawyer' | 'client' | 'detective' | 'admin' | 'staff';

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  lawyer: '변호사',
  client: '의뢰인',
  detective: '탐정',
  admin: '관리자',
  staff: '직원',
};

export const ROLE_HOME_PATHS: Record<UserRole, string> = {
  lawyer: '/dashboard',
  client: '/',
  detective: '/detective',
  admin: '/admin',
  staff: '/dashboard',
};

export function isValidRole(role: string): role is UserRole {
  return ['lawyer', 'client', 'detective', 'admin', 'staff'].includes(role);
}
