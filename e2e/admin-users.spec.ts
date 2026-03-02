import { expect, test } from '@playwright/test';
import { loginWithEmail, logout, signupWithEmail, uniqueEmail } from './helpers';

test('admin can browse user list and open user detail', async ({ page }) => {
  const userEmail = uniqueEmail('e2e.admin.users');
  const password = 'User12345!';

  await signupWithEmail(page, { email: userEmail, password, role: 'USER' });
  await logout(page);

  await loginWithEmail(page, 'admin@sabina.dev', 'Admin12345!');
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto('/admin/users');
  await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();

  await page.getByPlaceholder('Search by email, ID, or derived name').fill(userEmail);
  await page.getByRole('button', { name: 'Apply Filters' }).click();

  await expect(page.getByText(userEmail)).toBeVisible();
  await page.getByRole('button', { name: 'View Details' }).first().click();

  await expect(page.getByRole('heading', { name: 'Appointment Summary' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Appointments' })).toBeVisible();
});
