import { test, expect } from '@playwright/test';
import { loginViaApi, SEED_EMAIL, API_URL } from './helpers';

test.describe('Messaging (Inbox)', () => {
  test('inbox page is accessible when logged in', async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/inbox');
    await page.reload();
    await expect(page.locator('h2, h3').filter({ hasText: /inbox/i }).first()).toBeVisible({ timeout: 8_000 });
  });

  test('inbox redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/inbox');
    await expect(page).toHaveURL(/\/login/);
  });

  test('navbar shows Inbox link when logged in', async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/ads');
    await page.reload();
    await expect(page.locator('a:has-text("Inbox")')).toBeVisible({ timeout: 8_000 });
  });

  test('compose form is visible in inbox', async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/inbox');
    await page.reload();
    // There should be a "New Message" button or the compose form
    const composeBtn = page.locator('button', { hasText: /new message/i });
    await expect(composeBtn).toBeVisible({ timeout: 8_000 });
    await composeBtn.click();
    await expect(page.locator('input[formControlName="recipientEmail"]')).toBeVisible({ timeout: 5_000 });
  });

  test('FULL FLOW: send a message to self and see it in inbox', async ({ page }) => {
    // Timestamp-unique subject so previous test runs don't collide
    const subject = `E2E Subject ${Date.now()}`;

    await loginViaApi(page);
    await page.goto('/inbox');
    await page.reload();

    const composeBtn = page.locator('button', { hasText: /new message/i });
    await composeBtn.click();

    await page.locator('input[formControlName="recipientEmail"]').fill(SEED_EMAIL);
    await page.locator('input[formControlName="subject"]').fill(subject);
    await page.locator('textarea[formControlName="body"]').fill('Hello from the E2E test!');

    // Intercept the send request
    const [req] = await Promise.all([
      page.waitForRequest(req => req.url().includes('/api/Message/send'), { timeout: 8_000 }),
      page.locator('button[type="submit"]', { hasText: /send/i }).click(),
    ]);
    expect(req.method()).toBe('POST');

    // Compose form should close / succeed
    await page.waitForTimeout(1000);
    // Inbox should eventually contain the message
    await page.reload();
    await expect(page.locator(`text=${subject}`).first()).toBeVisible({ timeout: 10_000 });
  });

  test('unread badge appears in navbar when there are unread messages', async ({ page }) => {
    // Seed at least one unread message via API
    await loginViaApi(page);
    const token = (await page.evaluate(() => localStorage.getItem('auth_token'))) as string;
    await page.request.post(`${API_URL}/Message/send`, {
      data: { recipientEmail: SEED_EMAIL, subject: 'Badge test', body: 'Testing badge' },
      headers: { Authorization: `Bearer ${token}` },
    });

    await page.goto('/ads');
    await page.reload();

    // The unread badge pill should be visible
    await expect(page.locator('.badge.bg-danger')).toBeVisible({ timeout: 8_000 });
  });
});
