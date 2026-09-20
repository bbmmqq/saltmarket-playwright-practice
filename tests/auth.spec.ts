import { test, expect } from '@playwright/test';

test('AUTH-01: login with valid seeded user shows logged-in header', async ({ page }) => {
  await page.goto('/login.html');

  await page.getByTestId('login-email').fill('test@saltmarket.com');
  await page.getByTestId('login-password').fill('password123');
  await page.getByTestId('login-submit').click();

  await expect(page).toHaveURL('/index.html');
  await expect(page.getByTestId('account-name')).toHaveText('Hi, Test User');
  await expect(page.getByTestId('logout-btn')).toBeVisible();
});

test('AUTH-02: login with invalid credentials shows error message', async ({ page }) => {
  await page.goto('/login.html');

  await page.getByTestId('login-email').fill('invalid@example.com');
  await page.getByTestId('login-password').fill('wrongpassword');
  await page.getByTestId('login-submit').click();

  await expect(page.getByTestId('login-error')).toBeVisible();
});

test('AUTH-03: Register new user redirects to shop as logged in', async ({page}) =>  {
  await page.goto('/register.html');

  await page.getByTestId('register-name').fill('New User');
  await page.getByTestId('register-email').fill('newuser@example.com');
  await page.getByTestId('register-password').fill('password123');
  await page.getByTestId('register-confirm').fill('password123');
  await page.getByTestId('register-submit').click();

  await expect(page).toHaveURL('/index.html');
  await expect(page.getByTestId('account-name')).toHaveText('Hi, New User');
});

test('AUTH-04: Register with invalid email format shows error', async ({page}) =>  {
  await page.goto('/register.html');

  await page.getByTestId('register-name').fill('New User');
  await page.getByTestId('register-email').fill('invalid-email-format');
  await page.getByTestId('register-password').fill('password123');
  await page.getByTestId('register-confirm').fill('password123');
  await page.getByTestId('register-submit').click();

  await expect(page.getByTestId('register-error')).toBeVisible();
});

test('AUTH-05: 	register with duplicate email shows error', async ({page}) =>  {
  await page.goto('/register.html');

  await page.getByTestId('register-name').fill('Duplicate User');
  await page.getByTestId('register-email').fill('test@saltmarket.com');
  await page.getByTestId('register-password').fill('password123');
  await page.getByTestId('register-confirm').fill('password123');
  await page.getByTestId('register-submit').click();

  await expect(page.getByTestId('register-error')).toBeVisible();
});

test('AUTH-06: Register with short password shows error', async ({page}) =>  {
  await page.goto('/register.html');

  await page.getByTestId('register-name').fill('Short Password User');
  await page.getByTestId('register-email').fill('shortpassword@example.com');
  await page.getByTestId('register-password').fill('short');
  await page.getByTestId('register-confirm').fill('short');
  await page.getByTestId('register-submit').click();

  await expect(page.getByTestId('register-error')).toBeVisible();
});

test('AUTH-07: Register with missing required field shows error', async ({page}) =>  {
  await page.goto('/register.html');

  await page.getByTestId('register-name').fill('Missing Field User');
  await page.getByTestId('register-email').fill('missingfield@example.com');
  await page.getByTestId('register-password').fill('password123');
  // Intentionally leaving out password confirmation
  await page.getByTestId('register-submit').click();

  await expect(page.getByTestId('register-error')).toBeVisible();
});

test('AUTH-08: Logout redirects to login page and clears session', async ({ page }) => {
  await page.goto('/login.html');

  await page.getByTestId('login-email').fill('test@saltmarket.com');
  await page.getByTestId('login-password').fill('password123');
  await page.getByTestId('login-submit').click();

  await expect(page).toHaveURL('/index.html');
  await expect(page.getByTestId('account-name')).toHaveText('Hi, Test User');

  await page.getByTestId('logout-btn').click();

  await expect(page).toHaveURL('/login.html');
  await expect(page.getByTestId('login-email')).toBeVisible();
});