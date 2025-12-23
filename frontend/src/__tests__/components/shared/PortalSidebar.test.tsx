/**
 * PortalSidebar Active State Verification Tests
 * 005-lawyer-portal-pages Feature - T069
 *
 * Tests for FR-009: Sidebar highlights active page on all lawyer portal routes
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { PortalSidebar, NavGroup } from '@/components/shared/PortalSidebar';

// Mock Next.js navigation
const mockPathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  const MockLink = ({ children, href, className, onClick }: { children: React.ReactNode; href: string; className?: string; onClick?: () => void }) => (
    <a href={href} className={className} onClick={onClick} data-testid={`nav-link-${href}`}>
      {children}
    </a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Mock useAuth hook
const mockLogout = jest.fn();
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { name: '김변호사', email: 'lawyer@test.com' },
    logout: mockLogout,
  }),
}));

// Mock useRole hook
jest.mock('@/hooks/useRole', () => ({
  useRole: () => ({
    role: 'lawyer',
    displayName: '변호사',
  }),
}));

// Mock Logo component
jest.mock('@/components/shared/Logo', () => ({
  Logo: () => <div data-testid="logo">Logo</div>,
}));

// Mock NotificationDropdown component
jest.mock('@/components/shared/NotificationDropdown', () => ({
  NotificationDropdown: () => <div data-testid="notification-dropdown">Notifications</div>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Menu: () => <span data-testid="menu-icon">Menu</span>,
  X: () => <span data-testid="x-icon">X</span>,
  LogOut: () => <span data-testid="logout-icon">LogOut</span>,
  ChevronDown: () => <span data-testid="chevron-down">ChevronDown</span>,
  ChevronRight: () => <span data-testid="chevron-right">ChevronRight</span>,
}));

// Lawyer navigation groups (matches dev version structure)
const lawyerNavGroups: NavGroup[] = [
  {
    id: 'main',
    items: [
      {
        id: 'dashboard',
        label: '대시보드',
        href: '/lawyer/dashboard',
        icon: <span data-testid="dashboard-icon">dashboard</span>,
      },
      {
        id: 'cases',
        label: '케이스 관리',
        href: '/lawyer/cases',
        icon: <span data-testid="cases-icon">cases</span>,
      },
      {
        id: 'clients',
        label: '의뢰인 관리',
        href: '/lawyer/clients',
        icon: <span data-testid="clients-icon">clients</span>,
      },
      {
        id: 'investigators',
        label: '탐정/조사원',
        href: '/lawyer/investigators',
        icon: <span data-testid="investigators-icon">investigators</span>,
      },
    ],
  },
  {
    id: 'tools',
    label: '도구',
    items: [
      {
        id: 'calendar',
        label: '일정 관리',
        href: '/lawyer/calendar',
        icon: <span data-testid="calendar-icon">calendar</span>,
      },
      {
        id: 'messages',
        label: '메시지',
        href: '/lawyer/messages',
        icon: <span data-testid="messages-icon">messages</span>,
        badge: 0,
      },
      {
        id: 'billing',
        label: '청구/정산',
        href: '/lawyer/billing',
        icon: <span data-testid="billing-icon">billing</span>,
      },
    ],
  },
];

describe('PortalSidebar Active State - FR-009', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Lawyer Portal Routes', () => {
    it('should highlight "대시보드" when on /lawyer/dashboard', () => {
      mockPathname.mockReturnValue('/lawyer/dashboard');
      render(<PortalSidebar groups={lawyerNavGroups} />);

      const dashboardLink = screen.getByRole('link', { name: /대시보드/i });
      expect(dashboardLink).toHaveClass('bg-accent');
    });

    it('should highlight "케이스 관리" when on /lawyer/cases', () => {
      mockPathname.mockReturnValue('/lawyer/cases');
      render(<PortalSidebar groups={lawyerNavGroups} />);

      const casesLink = screen.getByRole('link', { name: /케이스 관리/i });
      expect(casesLink).toHaveClass('bg-accent');
    });

    it('should highlight "케이스 관리" when on /lawyer/cases/123 (nested route)', () => {
      mockPathname.mockReturnValue('/lawyer/cases/123');
      render(<PortalSidebar groups={lawyerNavGroups} />);

      const casesLink = screen.getByRole('link', { name: /케이스 관리/i });
      expect(casesLink).toHaveClass('bg-accent');
    });

    it('should highlight "의뢰인 관리" when on /lawyer/clients', () => {
      mockPathname.mockReturnValue('/lawyer/clients');
      render(<PortalSidebar groups={lawyerNavGroups} />);

      const clientsLink = screen.getByRole('link', { name: /의뢰인 관리/i });
      expect(clientsLink).toHaveClass('bg-accent');
    });

    it('should highlight "탐정/조사원" when on /lawyer/investigators', () => {
      mockPathname.mockReturnValue('/lawyer/investigators');
      render(<PortalSidebar groups={lawyerNavGroups} />);

      const investigatorsLink = screen.getByRole('link', { name: /탐정\/조사원/i });
      expect(investigatorsLink).toHaveClass('bg-accent');
    });

    it('should highlight "일정 관리" when on /lawyer/calendar', () => {
      mockPathname.mockReturnValue('/lawyer/calendar');
      render(<PortalSidebar groups={lawyerNavGroups} />);

      const calendarLink = screen.getByRole('link', { name: /일정 관리/i });
      expect(calendarLink).toHaveClass('bg-accent');
    });

    it('should highlight "메시지" when on /lawyer/messages', () => {
      mockPathname.mockReturnValue('/lawyer/messages');
      render(<PortalSidebar groups={lawyerNavGroups} />);

      const messagesLink = screen.getByRole('link', { name: /메시지/i });
      expect(messagesLink).toHaveClass('bg-accent');
    });

    it('should highlight "청구/정산" when on /lawyer/billing', () => {
      mockPathname.mockReturnValue('/lawyer/billing');
      render(<PortalSidebar groups={lawyerNavGroups} />);

      const billingLink = screen.getByRole('link', { name: /청구\/정산/i });
      expect(billingLink).toHaveClass('bg-accent');
    });
  });

  describe('Non-Active States', () => {
    it('should not highlight other nav items when on /lawyer/dashboard', () => {
      mockPathname.mockReturnValue('/lawyer/dashboard');
      render(<PortalSidebar groups={lawyerNavGroups} />);

      // Cases should not be highlighted
      const casesLink = screen.getByRole('link', { name: /케이스 관리/i });
      expect(casesLink).not.toHaveClass('bg-accent');
      expect(casesLink).toHaveClass('text-gray-700');

      // Calendar should not be highlighted
      const calendarLink = screen.getByRole('link', { name: /일정 관리/i });
      expect(calendarLink).not.toHaveClass('bg-accent');
    });
  });

  describe('Nested Route Highlighting', () => {
    it('should highlight "케이스 관리" for /lawyer/cases/123/evidence', () => {
      mockPathname.mockReturnValue('/lawyer/cases/123/evidence');
      render(<PortalSidebar groups={lawyerNavGroups} />);

      const casesLink = screen.getByRole('link', { name: /케이스 관리/i });
      expect(casesLink).toHaveClass('bg-accent');
    });

    it('should highlight "의뢰인 관리" for /lawyer/clients/456', () => {
      mockPathname.mockReturnValue('/lawyer/clients/456');
      render(<PortalSidebar groups={lawyerNavGroups} />);

      const clientsLink = screen.getByRole('link', { name: /의뢰인 관리/i });
      expect(clientsLink).toHaveClass('bg-accent');
    });

    it('should highlight "메시지" for /lawyer/messages/thread/123', () => {
      mockPathname.mockReturnValue('/lawyer/messages/thread/123');
      render(<PortalSidebar groups={lawyerNavGroups} />);

      const messagesLink = screen.getByRole('link', { name: /메시지/i });
      expect(messagesLink).toHaveClass('bg-accent');
    });
  });

  describe('Badge Display', () => {
    it('should show badge on nav item when badge count is greater than 0', () => {
      mockPathname.mockReturnValue('/lawyer/dashboard');
      const groupsWithBadge: NavGroup[] = JSON.parse(JSON.stringify(lawyerNavGroups));
      const toolsGroup = groupsWithBadge.find(g => g.id === 'tools');
      if (toolsGroup) {
        const messagesItem = toolsGroup.items.find(i => i.id === 'messages');
        if (messagesItem) {
          messagesItem.badge = 5;
          messagesItem.icon = <span>messages</span>;
        }
      }

      render(<PortalSidebar groups={groupsWithBadge} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should not show badge when badge count is 0', () => {
      mockPathname.mockReturnValue('/lawyer/dashboard');
      render(<PortalSidebar groups={lawyerNavGroups} />);

      // Messages badge should not be visible (badge is 0)
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });

  describe('User Info Display', () => {
    it('should display user initials in avatar', () => {
      mockPathname.mockReturnValue('/lawyer/dashboard');
      render(<PortalSidebar groups={lawyerNavGroups} />);

      // Should show first character of name
      expect(screen.getByText('김')).toBeInTheDocument();
    });

    it('should display user name', () => {
      mockPathname.mockReturnValue('/lawyer/dashboard');
      render(<PortalSidebar groups={lawyerNavGroups} />);

      expect(screen.getByText('김변호사')).toBeInTheDocument();
    });

    it('should display role display name', () => {
      mockPathname.mockReturnValue('/lawyer/dashboard');
      render(<PortalSidebar groups={lawyerNavGroups} />);

      expect(screen.getByText('변호사')).toBeInTheDocument();
    });
  });

  describe('Logout Functionality', () => {
    it('should render logout button', () => {
      mockPathname.mockReturnValue('/lawyer/dashboard');
      render(<PortalSidebar groups={lawyerNavGroups} />);

      const logoutButtons = screen.getAllByRole('button', { name: /로그아웃/i });
      expect(logoutButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Group Labels', () => {
    it('should render group labels when provided', () => {
      mockPathname.mockReturnValue('/lawyer/dashboard');
      render(<PortalSidebar groups={lawyerNavGroups} />);

      expect(screen.getByText('도구')).toBeInTheDocument();
    });
  });
});
