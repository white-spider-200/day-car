import Link from "next/link";
import { AppointmentStatus, Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthSession } from "@/lib/auth";
import { decodeNotesAndSessionMode } from "@/lib/session-mode";
import { prisma } from "@/lib/prisma";
import { toAmmanLabel } from "@/lib/time";
import { FALLBACK_VR_SCENARIOS } from "@/lib/vr-scenarios";

export default async function VrSessionPage({
  params
}: {
  params: { appointmentId: string };
}) {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/login");
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.appointmentId },
    include: {
      doctor: {
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      },
      patient: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!appointment) {
    return (
      <div className="section-shell py-10">
        <Card>
          <CardHeader>
            <CardTitle>VR Session Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">The appointment does not exist.</CardContent>
        </Card>
      </div>
    );
  }

  if (
    (session.user.role === Role.USER && appointment.patientId !== session.user.id) ||
    (session.user.role === Role.DOCTOR && appointment.doctorId !== session.user.doctorId) ||
    session.user.role === Role.ADMIN
  ) {
    return (
      <div className="section-shell py-10">
        <Card>
          <CardHeader>
            <CardTitle>Forbidden</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            You do not have permission to open this VR session.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { sessionMode, notes } = decodeNotesAndSessionMode(appointment.notes);
  if (sessionMode !== "vr") {
    return (
      <div className="section-shell py-10">
        <Card>
          <CardHeader>
            <CardTitle>Not a VR Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>This appointment is configured as Zoom.</p>
            <p>
              Please use dashboard actions for Zoom calls.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (appointment.status !== AppointmentStatus.CONFIRMED) {
    return (
      <div className="section-shell py-10">
        <Card>
          <CardHeader>
            <CardTitle>VR Session Not Ready</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            VR session becomes available after the doctor confirms the appointment.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="section-shell space-y-5 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Live VR Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>
            Doctor: <span className="font-medium">{appointment.doctor.user.name}</span>
          </p>
          <p>
            Patient: <span className="font-medium">{appointment.patient.name}</span>
          </p>
          <p>Time: {toAmmanLabel(new Date(appointment.startAt))}</p>
          {notes ? <p>Session Notes: {notes}</p> : null}
          <p>
            {session.user.role === Role.DOCTOR ? (
              <Link href={`/dashboard/doctor/vr?appointmentId=${appointment.id}`} className="text-medical-700 underline">
                Open doctor VR workspace
              </Link>
            ) : (
              "Follow your doctor guidance while playing the scenario videos."
            )}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {FALLBACK_VR_SCENARIOS.map((scenario) => (
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
