import { expect, test } from '@playwright/test';
import { loginWithEmail, logout, signupWithEmail, uniqueEmail } from './helpers';

test('signup/login routes users to the correct role dashboards', async ({ page }) => {
  const userEmail = uniqueEmail('e2e.user');
  const doctorEmail = uniqueEmail('e2e.doctor');
  const password = 'User12345!';

  await signupWithEmail(page, { email: userEmail, password, role: 'USER' });
  await expect(page.getByRole('heading', { name: 'Patient Dashboard' })).toBeVisible();
  await logout(page);

  await signupWithEmail(page, { email: doctorEmail, password, role: 'DOCTOR' });
  await expect(page.getByRole('heading', { name: 'Doctor Dashboard' })).toBeVisible();
  await logout(page);

  await loginWithEmail(page, 'admin@sabina.dev', 'Admin12345!');
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
});

test('role guards redirect authenticated users away from unauthorized dashboards', async ({ page }) => {
  const userEmail = uniqueEmail('e2e.guard.user');
  const password = 'User12345!';

  await signupWithEmail(page, { email: userEmail, password, role: 'USER' });
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto('/doctor-dashboard');
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto('/admin');
  await expect(page).toHaveURL(/\/dashboard$/);
});
