import { test, expect } from '@playwright/test';
import { url } from 'inspector/promises';

const user = {
  email: 'test@saltmarket.com',
  password: 'password123',
};

const admin = {
  email: 'admin@saltmarket.com',
  password: 'admin123',
};

async function login(
  page: import('@playwright/test').Page,
  account: typeof user | typeof admin,
) {
  await page.getByTestId('login-email').fill(account.email);
  await page.getByTestId('login-password').fill(account.password);
  await page.getByTestId('login-submit').click();
}

test('GUARD-01: visiting cart while logged out redirects to login with redirect param', async ({ page }) => {
  await page.goto('/cart.html');

  await expect(page).toHaveURL(/\/login.html/);

  const url = new URL(page.url());
  expect(url.searchParams.get('redirect')).toBe('/cart.html');
});

test('GUARD-02: login from redirect returns to originally requested page', async ({ page }) => {
  await page.goto('/cart.html');

  await expect(page).toHaveURL(/\/login.html/);

  await login(page, user);

  await expect(page).toHaveURL(/\/cart.html/);
});
for (const path of ['/checkout.html', '/confirmation.html']) {
  test(`GUARD-03: ${path} redirects to login when logged out`, async ({ page }) => {
    await page.goto(path);

    await expect(page).toHaveURL(/\/login.html/);

    const url = new URL(page.url());
    expect(url.searchParams.get('redirect')).toBe(path);
  });
}

test('GUARD-04: shop API endpoints respond without a session', async ({ request }) => {
  const productsResponse = await request.get('/api/products');
  const cartResponse = await request.get('/api/products');

  expect(productsResponse.ok()).toBe(true);
  expect(cartResponse.ok()).toBe(true);
  
  await expect(productsResponse.json()).resolves.toHaveProperty('items');
  await expect(cartResponse.json()).resolves.toHaveProperty('items');
});

test('GUARD-05: non-admin visiting admin page sees access denied', async ({ page }) => {
  await page.goto('/login.html');
  await login(page, user);

  await expect(page).toHaveURL(/\/index\.html/);

  await page.goto('/admin.html');

  await expect(page.getByTestId('admin-denied')).toBeVisible();
  await expect(page.locator('#admin-content')).toBeHidden();
});

test('GUARD-06: non-admin calling admin API gets 403', async ({ page, request }) => {
  await page.goto('/login.html');
  await login(page, user);

  const response = await request.get('/api/admin/products');

  expect(response.status()).toBe(403);
  await expect(response.json()).resolves.toEqual({
    "error":"Admin access required"
  });
});

test('GUARD-07: admin can load admin page and sees admin link', async ({ page }) => {
  await page.goto('/login.html');
  await login(page, admin);

  await expect(page).toHaveURL(/\/admin\.html/);
  await expect(page.getByTestId('admin-link')).toBeVisible();
  await expect(page.locator('#admin-content')).toBeVisible();
});

test('GUARD-08: browsing catalog and product pages without login', async ({ page }) => {
  await page.goto('/index.html')
  await expect(page).toHaveURL(/\/index\.html/);

  await page.goto('/product.html?id=1');
  await expect(page).toHaveURL(/\/product\.html\?id=1/);
});

test('GUARD-09: login page shows a notice when redirected from cart', async ({ page }) => {
  await page.goto('/cart.html')
  await expect(page).toHaveURL(/\/login\.html/);
  
  const url = new URL(page.url());
  expect(url.searchParams.get('redirect')).toBe('/cart.html')

  await expect(page.getByTestId('login-notice')).toBeVisible();
});