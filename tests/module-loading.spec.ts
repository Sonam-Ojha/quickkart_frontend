import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const token = `test.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.test`;
    localStorage.setItem('qk-admin-auth', JSON.stringify({
      state: { token, user: { id: 1, name: 'Local test', email: 'test@example.invalid', role: 'super_admin' } }, version: 0,
    }));
  });
  // All API calls are mocked. No notification is sent by these tests.
  await page.route('**/api/**', route => route.fulfill({
    contentType: 'application/json', body: JSON.stringify({ notifications: [], unreadCount: 0, schedules: [], users: [] }),
  }));
});

test('notifications page loads with all built assets present', async ({ page }) => {
  await page.goto('http://127.0.0.1:4178/notifications');
  await expect(page.getByRole('heading', { name: 'Push Notifications', exact: true })).toBeVisible();
  await expect(page.getByPlaceholder('Notification title')).toBeVisible();
});

test('one missing dependency recovers after a single automatic reload', async ({ page }) => {
  let requests = 0;
  await page.route('**/assets/send-*.js', async route => {
    requests++;
    if (requests === 1) await route.fulfill({ contentType: 'text/html', body: '<!doctype html><html>Old deployment</html>' });
    else await route.continue();
  });
  await page.goto('http://127.0.0.1:4178/notifications');
  await expect(page.getByRole('heading', { name: 'Push Notifications', exact: true })).toBeVisible();
  expect(requests).toBe(2);
});

test('persistent missing asset shows recovery UI instead of reloading forever', async ({ page }) => {
  let requests = 0;
  await page.route('**/assets/send-*.js', async route => {
    requests++;
    await route.fulfill({ contentType: 'text/html', body: '<!doctype html><html>Missing asset</html>' });
  });
  await page.goto('http://127.0.0.1:4178/notifications');
  await expect(page.getByRole('heading', { name: 'Page could not load' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reload page' })).toBeVisible();
  expect(requests).toBe(2);
});
