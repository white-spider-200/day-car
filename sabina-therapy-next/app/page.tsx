import { Hero } from "@/components/home/hero";
import { TopDoctors } from "@/components/home/top-doctors";
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

  return (
    <>
      <Hero />
      <TopDoctors doctors={topDoctors} />
    </>
  );
}
