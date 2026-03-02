import { expect, Page } from '@playwright/test';

export function uniqueEmail(prefix: string): string {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  return `${prefix}.${suffix}@sabina.dev`;
}

export async function signupWithEmail(
  page: Page,
  options: { email: string; password: string; role: 'USER' | 'DOCTOR' }
) {
  await page.goto('/signup');

  if (options.role === 'DOCTOR') {
    await page.getByRole('button', { name: 'Doctor' }).click();
  }

  await page.getByPlaceholder('name@example.com').fill(options.email);
  await page.locator('input[type="password"]').fill(options.password);
  await page.getByRole('button', { name: 'Create Account' }).click();

  if (options.role === 'DOCTOR') {
    await expect(page).toHaveURL(/\/doctor-dashboard$/);
  } else {
    await expect(page).toHaveURL(/\/dashboard$/);
  }
}

export async function loginWithEmail(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByPlaceholder('name@example.com').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login$/);
}
