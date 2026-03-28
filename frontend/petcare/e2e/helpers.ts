import { Page, expect } from '@playwright/test';

export const SEED_EMAIL = 'seed.user@petcare.local';
export const SEED_PASSWORD = 'Seed1234!';
export const BASE_URL = 'http://localhost:4200';
export const API_URL = 'http://localhost:5001/api';

/** Login via the UI and wait until the ads page is visible. */
export async function loginUI(page: Page, email = SEED_EMAIL, password = SEED_PASSWORD) {
  await page.goto('/login');
  await page.locator('input[formControlName="email"]').fill(email);
  await page.locator('input[formControlName="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  // After successful login the app redirects to /ads
  await expect(page).toHaveURL(/\/(ads)?$/, { timeout: 10_000 });
}

/** Login directly via the API and inject the token/userId into localStorage — faster than UI login. */
export async function loginViaApi(page: Page, email = SEED_EMAIL, password = SEED_PASSWORD) {
  const resp = await page.request.post(`${API_URL}/Auth/login`, {
    data: { email, password },
  });
  expect(resp.ok(), `API login failed: ${await resp.text()}`).toBeTruthy();
  const body = await resp.json();
  // Inject into the app's localStorage so Angular picks it up on first load
  await page.goto('/');
  await page.evaluate(({ token, userId }) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user_id', userId);
  }, { token: body.token as string, userId: body.userId as string });
  return body as { token: string; userId: string; role: string };
}

/** Register a fresh user via API. */
export async function registerViaApi(page: Page, email: string, password: string, role: 'PetOwner' | 'Petcarer' = 'PetOwner') {
  const ts = Date.now();
  const resp = await page.request.post(`${API_URL}/Auth/register`, {
    data: {
      firstName: 'Test',
      lastName: 'User',
      email,
      phone: '0888000000',
      password,
      role,
      userName: `testuser${ts}`,
    },
  });
  expect(resp.ok(), `Register failed: ${await resp.text()}`).toBeTruthy();
  return (await resp.json()) as { token: string; userId: string };
}
