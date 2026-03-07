import Link from "next/link";
import { AppointmentStatus, Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthSession } from "@/lib/auth";
import { decodeNotesAndSessionMode } from "@/lib/session-mode";
import { prisma } from "@/lib/prisma";
import { FALLBACK_VR_SCENARIOS } from "@/lib/vr-scenarios";
import { toAmmanLabel } from "@/lib/time";

export default async function DoctorVrWorkspacePage({
  searchParams
}: {
  searchParams?: { appointmentId?: string };
}) {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== Role.DOCTOR || !session.user.doctorId) {
    redirect("/dashboard");
  }

  const [appointments, scenarios] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        doctorId: session.user.doctorId,
        status: AppointmentStatus.CONFIRMED
      },
      include: {
        patient: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        startAt: "asc"
      },
      take: 30
    }),
    prisma.vrScenario.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 12
    })
  ]);

  const vrAppointments = appointments
    .map((item) => {
      const decoded = decodeNotesAndSessionMode(item.notes);
      return {
        ...item,
        cleanNotes: decoded.notes,
        sessionMode: decoded.sessionMode
      };
    })
    .filter((item) => item.sessionMode === "vr");

  const selectedAppointment =
    vrAppointments.find((item) => item.id === searchParams?.appointmentId) ?? vrAppointments[0] ?? null;

  const mergedScenarios =
    scenarios.length > 0
      ? scenarios.map((item) => ({
          id: item.id,
          title: item.titleEn,
          description: item.descriptionEn,
          youtubeId: item.youtubeId
        }))
      : FALLBACK_VR_SCENARIOS;

  return (
    <div className="section-shell space-y-5 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Doctor VR Workspace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>Use this page for VR appointments instead of Zoom.</p>
          <p>Pick a VR appointment, then run the scenario videos with your patient.</p>
          <Link href="/dashboard/doctor" className="text-medical-700 underline">
            Back to doctor dashboard
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Confirmed VR Appointments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {vrAppointments.map((item) => (
            <div key={item.id} className="rounded-md border border-slate-200 p-3">
              <p className="font-medium">{item.patient.name}</p>
              <p>{toAmmanLabel(new Date(item.startAt))}</p>
              {item.cleanNotes ? <p className="text-slate-600">Notes: {item.cleanNotes}</p> : null}
              <Link href={`/dashboard/doctor/vr?appointmentId=${item.id}`} className="mt-2 inline-block">
                <span className="text-sm font-medium text-medical-700 underline">Open this VR appointment</span>
              </Link>
            </div>
          ))}
          {vrAppointments.length === 0 ? <p className="text-slate-500">No confirmed VR appointments yet.</p> : null}
        </CardContent>
      </Card>

      {selectedAppointment ? (
        <Card>
          <CardHeader>
            <CardTitle>Active VR Appointment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Patient: <span className="font-medium">{selectedAppointment.patient.name}</span>
            </p>
            <p>Time: {toAmmanLabel(new Date(selectedAppointment.startAt))}</p>
            <p>
              Session page:{" "}
              <Link href={`/vr-session/${selectedAppointment.id}`} className="text-medical-700 underline">
                Open shared VR session page
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {mergedScenarios.map((scenario) => (
          <Card key={scenario.id}>
            <CardHeader>
              <CardTitle className="text-base">{scenario.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">{scenario.description}</p>
              <div className="overflow-hidden rounded-md border border-slate-200">
                <iframe
                  title={scenario.title}
                  src={`https://www.youtube.com/embed/${scenario.youtubeId}`}
                  className="h-56 w-full"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
