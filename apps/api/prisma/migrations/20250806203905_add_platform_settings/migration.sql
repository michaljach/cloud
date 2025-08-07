-- AlterTable
ALTER TABLE "public"."WorkspaceInvite" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + INTERVAL '7 days';

-- CreateTable
CREATE TABLE "public"."PlatformSettings" (
    "id" TEXT NOT NULL DEFAULT 'platform',
    "title" TEXT NOT NULL DEFAULT 'Cloud Platform',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "registrationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultStorageLimit" INTEGER NOT NULL DEFAULT 1024,
    "maxFileSize" INTEGER NOT NULL DEFAULT 100,
    "supportEmail" TEXT,
    "companyName" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);
