-- AlterTable
ALTER TABLE "public"."WorkspaceInvite" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + INTERVAL '7 days';
