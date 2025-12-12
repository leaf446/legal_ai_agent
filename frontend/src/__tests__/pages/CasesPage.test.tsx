/**
 * CasesPage Tests (Legacy Redirect Page)
 *
 * The /cases page is now a legacy redirect page that redirects users
 * to their role-specific case list page:
 * - lawyer → /lawyer/cases
 * - client → /client/cases
 * - detective → /detective/cases
 * - admin/staff → /lawyer/cases (default)
 */

import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js navigation
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    back: jest.fn(),
  }),
  usePathname: () => '/cases',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock useAuth hook
const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'lawyer',
};
const mockAuthValue = {
  isAuthenticated: true,
  isLoading: false,
  logout: jest.fn(),
  user: mockUser,
  getUser: () => mockUser,
  refreshAuth: jest.fn(),
  verifyAuth: jest.fn(),
};

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockAuthValue,
}));

// Import after mocks
import CasesPage from '@/app/cases/page';

describe('Legacy CasesPage Redirect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Role-based redirects', () => {
    it('redirects lawyer to /lawyer/cases', async () => {
      mockAuthValue.user = { ...mockUser, role: 'lawyer' };
      mockAuthValue.isAuthenticated = true;
      mockAuthValue.isLoading = false;

      render(<CasesPage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/lawyer/cases');
      });
    });

    it('redirects client to /client/cases', async () => {
      mockAuthValue.user = { ...mockUser, role: 'client' };
      mockAuthValue.isAuthenticated = true;
      mockAuthValue.isLoading = false;

      render(<CasesPage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/client/cases');
      });
    });

    it('redirects detective to /detective/cases', async () => {
      mockAuthValue.user = { ...mockUser, role: 'detective' };
      mockAuthValue.isAuthenticated = true;
      mockAuthValue.isLoading = false;

      render(<CasesPage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/detective/cases');
      });
    });

    it('redirects admin to /lawyer/cases', async () => {
      mockAuthValue.user = { ...mockUser, role: 'admin' };
      mockAuthValue.isAuthenticated = true;
      mockAuthValue.isLoading = false;

      render(<CasesPage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/lawyer/cases');
      });
    });

    it('redirects staff to /lawyer/cases', async () => {
      mockAuthValue.user = { ...mockUser, role: 'staff' };
      mockAuthValue.isAuthenticated = true;
      mockAuthValue.isLoading = false;

      render(<CasesPage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/lawyer/cases');
      });
    });
  });

  describe('Authentication redirect', () => {
    it('redirects to /login when not authenticated', async () => {
      mockAuthValue.isAuthenticated = false;
      mockAuthValue.isLoading = false;
      mockAuthValue.user = null as typeof mockUser | null;

      render(<CasesPage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Loading state', () => {
    it('shows loading indicator while auth is loading', () => {
      mockAuthValue.isLoading = true;
      mockAuthValue.isAuthenticated = false;

      const { container } = render(<CasesPage />);

      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });
});
