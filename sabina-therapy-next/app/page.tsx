import { Hero } from "@/components/home/hero";
import { TopDoctors } from "@/components/home/top-doctors";
import { VrDemoLibrary } from "@/components/home/vr-demo-library";
import { doctorPublicSelect } from "@/lib/doctors";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const topDoctors = await prisma.doctor.findMany({
    where: {
      isApproved: true,
      isTopDoctor: true
    },
    select: doctorPublicSelect,
    take: 3,
    orderBy: [{ fees: "asc" }]
  });

  const topVrScenarios = await prisma.vrScenario.findMany({
    include: {
      _count: {
        select: { sessions: true }
      }
    },
    orderBy: [{ sessions: { _count: "desc" } }, { createdAt: "desc" }],
    take: 3
  });

  return (
    <>
      <Hero />
      <TopDoctors doctors={topDoctors} />
      <VrDemoLibrary scenarios={topVrScenarios} />
    </>
  );
}
