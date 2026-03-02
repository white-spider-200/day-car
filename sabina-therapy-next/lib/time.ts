import { DateTime } from "luxon";

export const AMMAN_TIMEZONE = "Asia/Amman";

export function canAccessMeetingWindow(startAt: Date, endAt: Date, now = new Date()) {
  const start = DateTime.fromJSDate(startAt, { zone: "utc" }).setZone(AMMAN_TIMEZONE);
  const end = DateTime.fromJSDate(endAt, { zone: "utc" }).setZone(AMMAN_TIMEZONE);
  const current = DateTime.fromJSDate(now, { zone: "utc" }).setZone(AMMAN_TIMEZONE);

  const openAt = start.minus({ minutes: 10 });
  const closeAt = end.plus({ minutes: 10 });

  return current >= openAt && current <= closeAt;
}

export function toAmmanLabel(date: Date) {
  return DateTime.fromJSDate(date, { zone: "utc" }).setZone(AMMAN_TIMEZONE).toFormat("yyyy-LL-dd HH:mm");
}
