import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MockZoomPage({
  params,
  searchParams
}: {
  params: { appointmentId: string };
  searchParams?: { role?: string };
}) {
  return (
    <div className="section-shell py-10">
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Mock Zoom Meeting Room</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">Appointment ID: {params.appointmentId}</p>
          <p className="text-sm text-slate-600">Role: {searchParams?.role ?? "unknown"}</p>
          <p className="mt-3 text-sm text-slate-700">
            ZOOM_MOCK_MODE is enabled, so this page simulates Zoom start/join links while permissions and
            time-window checks are still enforced by the backend.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
