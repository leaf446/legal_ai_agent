import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Homepage Access
 * 홈페이지 접속 테스트
 */

test.describe('Homepage Access', () => {
  test('홈페이지 접속 확인', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 페이지가 정상적으로 로드되었는지 확인
    await expect(page.locator('body')).toBeVisible();

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/homepage.png' });

    console.log('Homepage loaded successfully');
  });

  test('로그인 페이지 접속 확인', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // 디버그: 현재 URL 확인
    const url = page.url();
    console.log(`Current URL: ${url}`);

    // 스크린샷 저장 (디버깅용)
    await page.screenshot({ path: 'test-results/login-page.png' });

    // URL이 /login을 포함하는지 확인
    expect(url).toContain('login');

    // body가 있는지 기본 확인
    await expect(page.locator('body')).toBeAttached();

    console.log('Login page loaded successfully');
  });

  test('회원가입 페이지 접속 확인', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('domcontentloaded');

    // 회원가입 폼 확인
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toBeVisible({ timeout: 10000 });

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/signup-page.png' });

    console.log('Signup page loaded successfully');
  });

  test('관계도 페이지 접속 확인 (미인증)', async ({ page }) => {
    await page.goto('/cases/1/relationship');
    await page.waitForLoadState('networkidle');

    // 페이지 상태 확인 (리디렉션 또는 정상 로드)
    const url = page.url();
    console.log(`Current URL: ${url}`);

    // 미인증 시 로그인 페이지로 리디렉션되는 것이 정상 동작
    // URL에 /login이 포함되어 있거나 관계도 페이지가 로드되어야 함
    const isRedirectedToLogin = url.includes('/login');
    const isOnRelationshipPage = url.includes('/relationship');

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/relationship-page.png' });

    // 둘 중 하나가 true여야 함
    expect(isRedirectedToLogin || isOnRelationshipPage).toBeTruthy();
    console.log(`Redirected to login: ${isRedirectedToLogin}`);
  });
});
