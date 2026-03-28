/**
 * Pure API-level tests (no browser rendering). These run fast and verify
 * backend contracts independently of Angular. If these pass but UI tests
 * fail, the bug is in the frontend code.
 */
import { test, expect } from '@playwright/test';
import { API_URL, SEED_EMAIL, SEED_PASSWORD } from './helpers';

let token: string;
let userId: string;

test.beforeAll(async ({ request }) => {
  const resp = await request.post(`${API_URL}/Auth/login`, {
    data: { email: SEED_EMAIL, password: SEED_PASSWORD },
  });
  expect(resp.ok(), `Login failed: ${await resp.text()}`).toBeTruthy();
  const body = await resp.json();
  token = body.token;
  userId = body.userId;
});

test.describe('API: Auth', () => {
  test('GET /Auth/login returns token and userId', async ({ request }) => {
    const resp = await request.post(`${API_URL}/Auth/login`, {
      data: { email: SEED_EMAIL, password: SEED_PASSWORD },
    });
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.isAuthenticated).toBe(true);
    expect(typeof body.token).toBe('string');
    expect(body.token.split('.').length).toBe(3);
    expect(typeof body.userId).toBe('string');
  });

  test('GET /Auth/login with bad password returns 401', async ({ request }) => {
    const resp = await request.post(`${API_URL}/Auth/login`, {
      data: { email: SEED_EMAIL, password: 'wrongpassword' },
    });
    expect(resp.status()).toBe(401);
  });

  test('Register new user returns token', async ({ request }) => {
    const ts = Date.now();
    const resp = await request.post(`${API_URL}/Auth/register`, {
      data: {
        firstName: 'API',
        lastName: 'Test',
        email: `apitest${ts}@test.com`,
        phone: '0888000000',
        password: 'Test1234!',
        role: 'PetOwner',
        userName: `apitest${ts}`,
      },
    });
    expect(resp.ok(), await resp.text()).toBeTruthy();
    const body = await resp.json();
    expect(body.isAuthenticated).toBe(true);
    expect(typeof body.token).toBe('string');
  });
});

test.describe('API: Ads', () => {
  test('GET /Ad/getAll returns array of ads', async ({ request }) => {
    const resp = await request.get(`${API_URL}/Ad/getAll`);
    expect(resp.ok()).toBeTruthy();
    const ads = await resp.json();
    expect(Array.isArray(ads)).toBe(true);
    expect(ads.length).toBeGreaterThan(0);
    // Each ad has required fields
    const ad = ads[0];
    expect(ad).toHaveProperty('id');
    expect(ad).toHaveProperty('title');
    expect(ad).toHaveProperty('town');
    expect(ad).toHaveProperty('price');
    expect(ad).toHaveProperty('serviceType');
    expect(ad).toHaveProperty('ownerId');
  });

  test('POST /Ad/create without auth returns 401 (not redirect)', async ({ request }) => {
    const resp = await request.post(`${API_URL}/Ad/create`, {
      data: { title: 'x', description: 'x', town: 'x', price: 1, serviceType: 1 },
    });
    // Must be 401, NOT 302 (which was the original bug)
    expect(resp.status()).toBe(401);
  });

  test('POST /Ad/create with valid JWT creates ad', async ({ request }) => {
    const resp = await request.post(`${API_URL}/Ad/create`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: 'API E2E Ad',
        description: 'Created by api.spec.ts',
        town: 'Plovdiv',
        xcordinates: '24.7465',
        ycordinates: '42.1354',
        price: 33,
        serviceType: 2,
      },
    });
    expect(resp.ok(), await resp.text()).toBeTruthy();
    const ad = await resp.json();
    expect(ad.isTrue).toBe(true);
    expect(ad.id).toBeTruthy();
    expect(ad.ownerId).toBe(userId);
    expect(ad.title).toBe('API E2E Ad');

    // Clean up
    await request.post(`${API_URL}/Ad/delete?id=${ad.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  });

  test('GET /Ad/getById returns ad with all fields', async ({ request }) => {
    const allResp = await request.get(`${API_URL}/Ad/getAll`);
    const ads = await allResp.json();
    const firstId = ads[0].id;

    const resp = await request.get(`${API_URL}/Ad/getById?id=${firstId}`);
    expect(resp.ok()).toBeTruthy();
    const ad = await resp.json();
    expect(ad.id).toBe(firstId);
    expect(ad.isTrue).toBe(true);
    expect(ad.ownerId).toBeTruthy();
  });

  test('POST /Ad/delete by non-owner returns 403', async ({ request }) => {
    // Register a second user and try to delete seed user's ad
    const ts = Date.now();
    const regResp = await request.post(`${API_URL}/Auth/register`, {
      data: {
        firstName: 'Other',
        lastName: 'User',
        email: `other${ts}@test.com`,
        phone: '0888111111',
        password: 'Test1234!',
        role: 'PetOwner',
        userName: `otheruser${ts}`,
      },
    });
    const otherUser = await regResp.json();

    const allResp = await request.get(`${API_URL}/Ad/getAll`);
    const ads = await allResp.json();
    const seedAdId = ads.find((a: any) => a.ownerId === userId)?.id;
    expect(seedAdId).toBeTruthy();

    const delResp = await request.post(`${API_URL}/Ad/delete?id=${seedAdId}`, {
      headers: { Authorization: `Bearer ${otherUser.token}` },
    });
    expect(delResp.status()).toBe(403);
  });

  test('FULL CYCLE: create then delete own ad', async ({ request }) => {
    // Create
    const createResp = await request.post(`${API_URL}/Ad/create`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: 'Cycle Test Ad',
        description: 'Will be deleted',
        town: 'Burgas',
        xcordinates: '27.4623',
        ycordinates: '42.5048',
        price: 5,
        serviceType: 3,
      },
    });
    expect(createResp.ok()).toBeTruthy();
    const created = await createResp.json();
    expect(created.isTrue).toBe(true);

    // Verify it appears in getAll
    const allResp = await request.get(`${API_URL}/Ad/getAll`);
    const ads = await allResp.json();
    expect(ads.some((a: any) => a.id === created.id)).toBe(true);

    // Delete
    const delResp = await request.post(`${API_URL}/Ad/delete?id=${created.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(delResp.ok()).toBeTruthy();

    // Verify it's gone
    const allAfterResp = await request.get(`${API_URL}/Ad/getAll`);
    const adsAfter = await allAfterResp.json();
    expect(adsAfter.some((a: any) => a.id === created.id)).toBe(false);
  });
});

test.describe('API: Messages', () => {
  test('GET /Message/inbox requires auth', async ({ request }) => {
    const resp = await request.get(`${API_URL}/Message/inbox`);
    expect(resp.status()).toBe(401);
  });

  test('POST /Message/send and GET /Message/inbox', async ({ request }) => {
    const sendResp = await request.post(`${API_URL}/Message/send`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { recipientEmail: SEED_EMAIL, subject: 'API Test', body: 'Hello from api.spec.ts' },
    });
    expect(sendResp.ok(), await sendResp.text()).toBeTruthy();
    const msg = await sendResp.json();
    expect(msg.id).toBeTruthy();

    const inboxResp = await request.get(`${API_URL}/Message/inbox`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(inboxResp.ok()).toBeTruthy();
    const inbox = await inboxResp.json();
    expect(Array.isArray(inbox)).toBe(true);
    expect(inbox.some((m: any) => m.id === msg.id)).toBe(true);
  });

  test('GET /Message/unread-count returns number', async ({ request }) => {
    const resp = await request.get(`${API_URL}/Message/unread-count`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(typeof body.count).toBe('number');
  });
});
