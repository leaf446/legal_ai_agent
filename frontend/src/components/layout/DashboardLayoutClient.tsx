'use client';

/**
 * Dashboard Layout Client Component
 * Client-side rendering for sidebar and navigation
 */

import dynamic from 'next/dynamic';
import {
  LayoutDashboard,
  Briefcase,
  FileUp,
  FileText,
  Users,
  Calendar,
  MessageSquare,
  CreditCard,
  UserCog,
  Shield,
} from 'lucide-react';
import Footer from '@/components/common/Footer';
import { NavGroup } from '@/components/shared/PortalSidebar';

// Dynamic imports to prevent SSR issues with usePathname
const PortalSidebar = dynamic(
  () => import('@/components/shared/PortalSidebar').then((mod) => mod.PortalSidebar),
  { ssr: false }
);
const NotificationDropdown = dynamic(
  () => import('@/components/shared/NotificationDropdown').then((mod) => mod.NotificationDropdown),
  { ssr: false }
);

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'core',
    label: 'Core',
    items: [
      {
        id: 'dashboard',
        label: '대시보드',
        href: '/dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
      },
      {
        id: 'cases',
        label: '케이스 관리',
        href: '/cases',
        icon: <Briefcase className="w-5 h-5" />,
      },
    ],
  },
  {
    id: 'work',
    label: 'Work',
    items: [
      {
        id: 'evidence-upload',
        label: '증거 업로드',
        href: '/evidence/upload',
        icon: <FileUp className="w-5 h-5" />,
      },
      {
        id: 'drafts',
        label: '초안 생성',
        href: '/drafts',
        icon: <FileText className="w-5 h-5" />,
      },
    ],
  },
  {
    id: 'management',
    label: 'Management',
    items: [
      {
        id: 'clients',
        label: '의뢰인',
        href: '/clients',
        icon: <Users className="w-5 h-5" />,
      },
      {
        id: 'calendar',
        label: '일정 관리',
        href: '/calendar',
        icon: <Calendar className="w-5 h-5" />,
      },
      {
        id: 'messages',
        label: '메시지',
        href: '/messages',
        icon: <MessageSquare className="w-5 h-5" />,
        badge: 3,
      },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    collapsible: true,
    items: [
      {
        id: 'billing',
        label: '청구/정산',
        href: '/settings/billing',
        icon: <CreditCard className="w-5 h-5" />,
      },
      {
        id: 'users',
        label: '사용자 관리',
        href: '/admin/users',
        icon: <UserCog className="w-5 h-5" />,
      },
      {
        id: 'roles',
        label: '권한 설정',
        href: '/admin/roles',
        icon: <Shield className="w-5 h-5" />,
      },
    ],
  },
];

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Sidebar */}
      <PortalSidebar groups={NAV_GROUPS} />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header (Desktop) */}
        <header className="hidden lg:flex h-16 bg-white border-b border-gray-200 px-6 items-center justify-end gap-4 sticky top-0 z-20">
          <NotificationDropdown />
        </header>

        {/* Mobile top padding to account for fixed header */}
        <div className="lg:hidden h-16" />

        {/* Page Content */}
        <main className="flex-grow">{children}</main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
