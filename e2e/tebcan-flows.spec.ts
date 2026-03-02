import { expect, request as playwrightRequest, test } from '@playwright/test';
import { loginWithEmail, uniqueEmail } from './helpers';

const API_BASE = process.env.E2E_API_BASE_URL ?? 'http://localhost:8000';

async function apiRegister(email: string, password: string, role: 'USER' | 'DOCTOR') {
  const api = await playwrightRequest.newContext();
  const response = await api.post(`${API_BASE}/auth/register`, {
    data: { email, password, role }
  });
  await api.dispose();
  return response;
}

async function apiLogin(email: string, password: string): Promise<string> {
  const api = await playwrightRequest.newContext();
  const response = await api.post(`${API_BASE}/auth/login`, {
    data: { email, password }
  });
  const payload = await response.json();
  await api.dispose();
  return payload.access_token as string;
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

function nextWeekdayDate(weekday: number): string {
  const now = new Date();
  const todayWeekday = now.getDay();
  const delta = (weekday - todayWeekday + 7) % 7;
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + delta);
  return date.toISOString().slice(0, 10);
}

function toDatetimeLocal(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

async function setupBookableDoctorAndSlot() {
  const doctorEmail = uniqueEmail('e2e.tebcan.doctor');
  const user1Email = uniqueEmail('e2e.tebcan.user1');
  const user2Email = uniqueEmail('e2e.tebcan.user2');
  const password = 'User12345!';

  const api = await playwrightRequest.newContext();

  await apiRegister(doctorEmail, password, 'DOCTOR');
  await apiRegister(user1Email, password, 'USER');
  await apiRegister(user2Email, password, 'USER');

  const doctorToken = await apiLogin(doctorEmail, password);
  const adminToken = await apiLogin('admin@sabina.dev', 'Admin12345!');
  const user1Token = await apiLogin(user1Email, password);
  const user2Token = await apiLogin(user2Email, password);

  await api.post(`${API_BASE}/doctor/application/save`, {
    headers: authHeaders(doctorToken),
    data: {
      display_name: 'E2E Doctor Tebcan',
      headline: 'E2E Flow Doctor',
      specialties: ['Therapy'],
      languages: ['English'],
      session_types: ['VIDEO'],
      pricing_per_session: '40.00'
    }
  });
  await api.post(`${API_BASE}/doctor/application/submit`, {
    headers: authHeaders(doctorToken)
  });

  const appResponse = await api.get(`${API_BASE}/doctor/application`, {
    headers: authHeaders(doctorToken)
  });
  const appPayload = await appResponse.json();
  const applicationId = appPayload.id as string;
  const doctorUserId = appPayload.doctor_user_id as string;

  await api.post(`${API_BASE}/admin/applications/${applicationId}/approve`, {
    headers: authHeaders(adminToken),
    data: { note: 'Approved for E2E' }
  });

  const targetDate = nextWeekdayDate(0);
  const targetWeekday = new Date(targetDate).getDay();
  await api.post(`${API_BASE}/doctor/availability/rules`, {
    headers: authHeaders(doctorToken),
    data: [
      {
        day_of_week: targetWeekday,
        start_time: '09:00:00',
        end_time: '12:00:00',
        timezone: 'Asia/Amman',
        slot_duration_minutes: 50,
        buffer_minutes: 10,
        is_blocked: false
      }
    ]
  });

  const slotsResponse = await api.get(
    `${API_BASE}/doctors/${doctorUserId}/availability?date_from=${targetDate}&date_to=${targetDate}`
  );
  const slotsPayload = (await slotsResponse.json()) as Array<{ start_at: string }>;
  const slotStart = slotsPayload[0]?.start_at;

  const doctorsResponse = await api.get(`${API_BASE}/doctors`);
  const doctorsPayload = (await doctorsResponse.json()) as Array<{ doctor_user_id: string; slug: string }>;
  const slug = doctorsPayload.find((item) => item.doctor_user_id === doctorUserId)?.slug ?? '';

  await api.dispose();

  return {
    doctorToken,
    user1Token,
    user2Token,
    doctorUserId,
    user1Email,
    user2Email,
    password,
    slotStart,
    slug
  };
}

test('waiting list flow: user can join when slot is full', async ({ page }) => {
  const setup = await setupBookableDoctorAndSlot();
  expect(setup.slotStart).toBeTruthy();
  expect(setup.slug).toBeTruthy();

  const api = await playwrightRequest.newContext();
  const user1Request = await api.post(`${API_BASE}/appointments/request`, {
    headers: authHeaders(setup.user1Token),
    data: {
      doctor_user_id: setup.doctorUserId,
      start_at: setup.slotStart,
      timezone: 'Asia/Amman'
    }
  });
  expect(user1Request.ok()).toBeTruthy();
  const user1Appointment = await user1Request.json();
  const appointmentId = user1Appointment.id as string;
  await api.post(`${API_BASE}/doctor/appointments/${appointmentId}/confirm`, {
    headers: authHeaders(setup.doctorToken)
  });
  await api.dispose();

  await loginWithEmail(page, setup.user2Email, setup.password);
  await page.goto(`/doctors/${setup.slug}`);
  await page.locator('input[type="datetime-local"]').fill(toDatetimeLocal(setup.slotStart));
  await page.getByRole('button', { name: 'Request Appointment' }).click();

  await expect(page.getByRole('button', { name: 'Join Waiting List' })).toBeVisible();
  await page.getByRole('button', { name: 'Join Waiting List' }).click();
  await expect(page.getByText('waiting list position')).toBeVisible();
});

test('video booking flow: user can pay from dashboard and unlock call actions', async ({ page }) => {
  const setup = await setupBookableDoctorAndSlot();
  expect(setup.slotStart).toBeTruthy();

  const api = await playwrightRequest.newContext();
  const userRequest = await api.post(`${API_BASE}/appointments/request`, {
    headers: authHeaders(setup.user1Token),
    data: {
      doctor_user_id: setup.doctorUserId,
      start_at: setup.slotStart,
      timezone: 'Asia/Amman'
    }
  });
  expect(userRequest.ok()).toBeTruthy();
  const appointmentPayload = await userRequest.json();
  const appointmentId = appointmentPayload.id as string;
  await api.post(`${API_BASE}/doctor/appointments/${appointmentId}/confirm`, {
    headers: authHeaders(setup.doctorToken)
  });
  await api.dispose();

  await loginWithEmail(page, setup.user1Email, setup.password);
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Patient Dashboard' })).toBeVisible();

  const payButton = page.getByRole('button', { name: 'Pay for Video' }).first();
  await expect(payButton).toBeVisible();
  await payButton.click();

  await expect(page.getByText('Paid: Yes').or(page.getByText('Join Video Call').or(page.getByText('Video join opens')))).toBeVisible();
});
