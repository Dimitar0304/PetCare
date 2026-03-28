import { test, expect } from '@playwright/test';
import { loginUI, SEED_EMAIL, SEED_PASSWORD } from './helpers';

test.describe('Authentication', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h2')).toContainText('Login');
    await expect(page.locator('input[formControlName="email"]')).toBeVisible();
    await expect(page.locator('input[formControlName="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('login with valid credentials redirects to ads', async ({ page }) => {
    await loginUI(page);
    await expect(page).toHaveURL(/\/(ads)?$/);
    // Navbar should show role
    await expect(page.locator('nav')).toContainText('Seeker');
  });

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[formControlName="email"]').fill(SEED_EMAIL);
    await page.locator('input[formControlName="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('.alert-danger')).toBeVisible({ timeout: 8_000 });
  });

  test('login with unknown email shows error', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[formControlName="email"]').fill('nobody@nowhere.com');
    await page.locator('input[formControlName="password"]').fill(SEED_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('.alert-danger')).toBeVisible({ timeout: 8_000 });
  });

  test('register page loads correctly', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('h2')).toContainText('Register');
    await expect(page.locator('input[formControlName="firstName"]')).toBeVisible();
    await expect(page.locator('input[formControlName="email"]')).toBeVisible();
    await expect(page.locator('select[formControlName="role"]')).toBeVisible();
  });

  test('register new user and redirect to ads', async ({ page }) => {
    const ts = Date.now();
    await page.goto('/register');
    await page.locator('input[formControlName="firstName"]').fill('E2E');
    await page.locator('input[formControlName="lastName"]').fill('Tester');
    await page.locator('input[formControlName="userName"]').fill(`e2e${ts}`);
    await page.locator('input[formControlName="phone"]').fill('0888123456');
    await page.locator('input[formControlName="email"]').fill(`e2e${ts}@test.com`);
    await page.locator('input[formControlName="password"]').fill('Test1234!');
    await page.locator('select[formControlName="role"]').selectOption('Seeker');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/ads/, { timeout: 10_000 });
  });

  test('logout clears session and removes role from navbar', async ({ page }) => {
    await loginUI(page);
    // Open Account menu
    await page.locator('button:has-text("Account")').click();
    await page.locator('button:has-text("Logout")').click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('nav')).not.toContainText('Seeker');
  });

  test('protected route redirects unauthenticated user to login', async ({ page }) => {
    // Clear any existing token
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/ads/create');
    await expect(page).toHaveURL(/\/login/);
  });
});
