import { test, expect } from '@playwright/test';

test.describe('Landing Page Redirect Issue', () => {
  test('should load landing page instead of redirecting to login', async ({ page }) => {
    // 1. Clear cookies to ensure unauthenticated state
    await page.context().clearCookies();
    
    // 2. Go to root
    await page.goto('/');
    
    // 3. Verify we are NOT redirected to login
    await expect(page).toHaveURL('http://localhost:3000/');
    
    // 4. Verify landing page content
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByText('Legal Evidence Hub')).toBeVisible();
  });
});
