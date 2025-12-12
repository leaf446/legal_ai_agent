/**
 * Case List Dashboard Tests (Legacy Redirect Page)
 *
 * The /cases page is now a legacy redirect page.
 * This test file verifies redirect behavior.
 *
 * The actual case list dashboard functionality has moved to:
 * - /lawyer/cases for lawyers
 * - /client/cases for clients
 * - /detective/cases for detectives
 */

import { render, waitFor } from '@testing-library/react';

// Mock Next.js navigation
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: mockReplace,
      back: jest.fn(),
    };
  },
  usePathname() {
    return '/cases';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock useAuth hook with mutable values
const mockAuthState = {
  isAuthenticated: true,
  isLoading: false,
  logout: jest.fn(),
  user: { id: '1', role: 'lawyer', name: 'Test User', email: 'test@example.com' },
};

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

// Import after mocks
import CasesPage from '@/app/cases/page';

describe('Case List Dashboard (Legacy Redirect)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default state
    mockAuthState.isAuthenticated = true;
    mockAuthState.isLoading = false;
    mockAuthState.user = { id: '1', role: 'lawyer', name: 'Test User', email: 'test@example.com' };
  });

  describe('Redirect Behavior', () => {
    it('redirects authenticated lawyer to /lawyer/cases', async () => {
      mockAuthState.user = { id: '1', role: 'lawyer', name: 'Test', email: 'test@test.com' };

      render(<CasesPage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/lawyer/cases');
      });
    });

    it('redirects authenticated client to /client/cases', async () => {
      mockAuthState.user = { id: '1', role: 'client', name: 'Test', email: 'test@test.com' };

      render(<CasesPage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/client/cases');
      });
    });

    it('redirects unauthenticated user to /login', async () => {
      mockAuthState.isAuthenticated = false;
      mockAuthState.user = null as typeof mockAuthState.user | null;

      render(<CasesPage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login');
      });
    });

    it('shows loading spinner while checking authentication', () => {
      mockAuthState.isLoading = true;

      const { container } = render(<CasesPage />);

      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Note: Full dashboard tests moved', () => {
    /**
     * Full dashboard functionality tests are now in:
     * - src/__tests__/app/lawyer/cases.test.tsx
     * - src/__tests__/app/client/cases.test.tsx
     * - src/__tests__/app/detective/cases.test.tsx
     */
    it('is now a redirect page (see role-specific test files)', () => {
      expect(true).toBe(true);
    });
  });
});
