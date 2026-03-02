import { AppointmentStatus } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

type ZoomCreateResult = {
  zoomMeetingId: string;
  zoomJoinUrl: string;
  zoomStartUrl: string;
  provider: "mock" | "zoom";
};

async function getZoomAccessToken() {
  if (!env.ZOOM_CLIENT_ID || !env.ZOOM_CLIENT_SECRET || !env.ZOOM_ACCOUNT_ID) {
    throw new Error("Missing Zoom credentials");
  }

  const basic = Buffer.from(`${env.ZOOM_CLIENT_ID}:${env.ZOOM_CLIENT_SECRET}`).toString("base64");
  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${env.ZOOM_ACCOUNT_ID}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Zoom token request failed: ${response.status}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

async function createLiveZoomMeeting(startAt: Date, endAt: Date, doctorName: string): Promise<ZoomCreateResult> {
  const accessToken = await getZoomAccessToken();
  const duration = Math.max(30, Math.floor((endAt.getTime() - startAt.getTime()) / (1000 * 60)));

  const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      topic: `Sabina Therapy Session - ${doctorName}`,
      type: 2,
      start_time: startAt.toISOString(),
      duration,
      timezone: "Asia/Amman",
      settings: {
        waiting_room: true,
        join_before_host: false
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Zoom meeting creation failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    id: number;
    join_url: string;
    start_url: string;
  };

  return {
    zoomMeetingId: String(data.id),
    zoomJoinUrl: data.join_url,
    zoomStartUrl: data.start_url,
    provider: "zoom"
  };
}

function createMockZoomMeeting(appointmentId: string): ZoomCreateResult {
  const base = env.NEXTAUTH_URL ?? "http://localhost:3000";
  return {
    zoomMeetingId: `mock-${appointmentId}`,
    zoomJoinUrl: `${base}/mock-zoom/${appointmentId}?role=patient`,
    zoomStartUrl: `${base}/mock-zoom/${appointmentId}?role=doctor`,
    provider: "mock"
  };
}

export async function createZoomMeetingForAppointment(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      doctor: {
        include: { user: true }
      },
      zoomMeeting: true
    }
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  if (appointment.status !== AppointmentStatus.CONFIRMED) {
    throw new Error("Appointment must be confirmed first");
  }

  if (appointment.zoomMeeting) {
    return appointment.zoomMeeting;
  }

  const result = env.ZOOM_MOCK_MODE
    ? createMockZoomMeeting(appointment.id)
    : await createLiveZoomMeeting(appointment.startAt, appointment.endAt, appointment.doctor.user.name);

  return prisma.zoomMeeting.create({
    data: {
      appointmentId: appointment.id,
      zoomMeetingId: result.zoomMeetingId,
      zoomJoinUrl: result.zoomJoinUrl,
      zoomStartUrl: result.zoomStartUrl,
      provider: result.provider
    }
  });
}
