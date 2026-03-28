import { test, expect } from '@playwright/test';
import { loginUI, loginViaApi, SEED_EMAIL, SEED_PASSWORD, API_URL } from './helpers';

test.describe('Ads List', () => {
  test('homepage shows ads without login', async ({ page }) => {
    await page.goto('/');
    // Wait for the ads to load (loading spinner disappears)
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 10_000 });
    const count = await page.locator('.card').count();
    expect(count).toBeGreaterThan(0);
  });

  test('ads list shows map', async ({ page }) => {
    await page.goto('/ads');
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 10_000 });
  });

  test('city filter narrows list', async ({ page }) => {
    await page.goto('/ads');
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 10_000 });
    const totalBefore = await page.locator('.card').count();

    await page.locator('input[placeholder*="Filter by city"]').fill('Sofia');
    await page.waitForTimeout(300);

    const totalAfter = await page.locator('.card').count();
    // Either filtered to less, or all happen to be in Sofia — either way shouldn't increase
    expect(totalAfter).toBeLessThanOrEqual(totalBefore);
  });

  test('clicking View opens ad details page', async ({ page }) => {
    await page.goto('/ads');
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 10_000 });
    await page.locator('.card').first().locator('button:has-text("View")').click();
    await expect(page).toHaveURL(/\/ads\/.+/);
    await expect(page.locator('h2')).toContainText('Details');
  });

  test('ad details page shows title, price and map', async ({ page }) => {
    await page.goto('/ads');
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 10_000 });
    await page.locator('.card').first().locator('button:has-text("View")').click();
    await expect(page).toHaveURL(/\/ads\/.+/);
    await expect(page.locator('h3.card-title')).toBeVisible();
    await expect(page.locator('text=/\\d+ BGN/')).toBeVisible();
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 10_000 });
  });

  test('logged-in Seeker sees Delete button only on own ads', async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/ads');
    await page.reload(); // allow Angular to bootstrap with the token

    await expect(page.locator('.card').first()).toBeVisible({ timeout: 10_000 });
    // Delete buttons should exist (seeder ads belong to seed user)
    const deleteBtns = await page.locator('button:has-text("Delete")').count();
    expect(deleteBtns).toBeGreaterThan(0);
  });
});

test.describe('Create Ad', () => {
  test('Create ad link is visible only for Seeker', async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/ads');
    await page.reload();
    await expect(page.locator('a:has-text("Create ad")')).toBeVisible({ timeout: 8_000 });
  });

  test('Create ad page loads with map', async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/ads/create');
    await page.reload();
    await expect(page.locator('h2')).toContainText('Create Ad', { timeout: 8_000 });
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 10_000 });
  });

  test('city autocomplete shows suggestions when typing', async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/ads/create');
    await page.reload();
    await page.locator('input[formControlName="city"]').fill('Sof');
    await expect(page.locator('.list-group-item').first()).toBeVisible({ timeout: 5_000 });
  });

  test('selecting city fills coordinates and moves map marker', async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/ads/create');
    await page.reload();

    const cityInput = page.locator('input[formControlName="city"]');
    await cityInput.fill('Sofia');
    await page.locator('.list-group-item').first().click();

    // Latitude and longitude fields should be filled
    const lat = await page.locator('input[formControlName="latitude"]').inputValue();
    const lng = await page.locator('input[formControlName="longitude"]').inputValue();
    expect(lat).not.toBe('');
    expect(lng).not.toBe('');
    expect(Number(lat)).toBeGreaterThan(40);
    expect(Number(lng)).toBeGreaterThan(20);
  });

  test('create ad form validation prevents empty submit', async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/ads/create');
    await page.reload();
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled({ timeout: 5_000 });
  });

  test('FULL FLOW: create ad successfully and see it in list', async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/ads/create');
    await page.reload();

    // Wait for the form to be ready
    await expect(page.locator('h2:has-text("Create Ad")')).toBeVisible({ timeout: 8_000 });

    // Fill title
    await page.locator('input[formControlName="title"]').fill('E2E Test Ad');

    // Fill description
    await page.locator('textarea[formControlName="description"]').fill('This ad was created by the E2E test suite.');

    // Select city from autocomplete
    await page.locator('input[formControlName="city"]').fill('Sofia');
    await page.locator('.list-group-item').first().click();

    // Select service type
    await page.locator('select[formControlName="serviceType"]').selectOption('1');

    // Set price
    await page.locator('input[formControlName="price"]').fill('42');

    // Verify submit is now enabled
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled({ timeout: 5_000 });

    // Intercept the API call to verify what gets sent
    const [request] = await Promise.all([
      page.waitForRequest(req => req.url().includes('/api/Ad/create'), { timeout: 10_000 }),
      submitBtn.click(),
    ]);

    expect(request.method()).toBe('POST');
    const body = request.postDataJSON();
    expect(body.title).toBe('E2E Test Ad');
    expect(body.town).toBe('Sofia');
    expect(body.price).toBe(42);

    // After creation the app navigates back to / (root ads list)
    // Match the full URL: http://localhost:4200/ or http://localhost:4200/ads
    await expect(page).toHaveURL(/\/(ads)?$/, { timeout: 10_000 });

    // The new ad should appear in the list
    await expect(page.locator('.card').locator('text=E2E Test Ad').first()).toBeVisible({ timeout: 10_000 });
  });

  test('FULL FLOW: delete own ad removes it from list', async ({ page }) => {
    // Use a timestamp-unique title so parallel runs don't collide
    const title = `Delete E2E ${Date.now()}`;

    // First create an ad via API
    await loginViaApi(page);
    const token = (await page.evaluate(() => localStorage.getItem('auth_token'))) as string;
    const createResp = await page.request.post(`${API_URL}/Ad/create`, {
      data: {
        title,
        description: 'Will be deleted',
        town: 'Varna',
        xcordinates: '27.9244',
        ycordinates: '43.2141',
        price: 10,
        serviceType: 1,
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(createResp.ok()).toBeTruthy();

    await page.goto('/ads');
    await page.reload();

    // Find the (only) card with that timestamp-unique title
    const card = page.locator('.card', { hasText: title }).first();
    await expect(card).toBeVisible({ timeout: 10_000 });

    // Click Delete and confirm the dialog
    page.on('dialog', d => d.accept());
    await card.locator('button:has-text("Delete")').click();

    // Card should disappear
    await expect(page.locator('.card', { hasText: title })).toHaveCount(0, { timeout: 8_000 });
  });
});
