CREATE TYPE "VrSessionStatus" AS ENUM ('WAITING', 'LIVE', 'ENDED');

CREATE TABLE "VrScenario" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "titleEn" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VrScenario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VrSession" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "scenarioId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT,
    "status" "VrSessionStatus" NOT NULL DEFAULT 'WAITING',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VrSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VrScenario_slug_key" ON "VrScenario"("slug");
CREATE INDEX "VrScenario_createdAt_idx" ON "VrScenario"("createdAt");
CREATE INDEX "VrScenario_createdById_idx" ON "VrScenario"("createdById");

CREATE INDEX "VrSession_scenarioId_createdAt_idx" ON "VrSession"("scenarioId", "createdAt");
CREATE INDEX "VrSession_doctorId_createdAt_idx" ON "VrSession"("doctorId", "createdAt");
CREATE INDEX "VrSession_patientId_idx" ON "VrSession"("patientId");
CREATE INDEX "VrSession_status_createdAt_idx" ON "VrSession"("status", "createdAt");

ALTER TABLE "VrScenario"
ADD CONSTRAINT "VrScenario_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VrSession"
ADD CONSTRAINT "VrSession_scenarioId_fkey"
FOREIGN KEY ("scenarioId") REFERENCES "VrScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VrSession"
ADD CONSTRAINT "VrSession_doctorId_fkey"
FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VrSession"
ADD CONSTRAINT "VrSession_patientId_fkey"
FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
