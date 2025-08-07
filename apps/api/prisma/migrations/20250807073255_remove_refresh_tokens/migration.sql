/*
  Warnings:

  - You are about to drop the column `refreshToken` on the `OAuthToken` table. All the data in the column will be lost.
  - You are about to drop the column `refreshTokenExpiresAt` on the `OAuthToken` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."OAuthToken_refreshToken_key";

-- AlterTable
ALTER TABLE "public"."OAuthToken" DROP COLUMN "refreshToken",
DROP COLUMN "refreshTokenExpiresAt";

-- AlterTable
ALTER TABLE "public"."WorkspaceInvite" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + INTERVAL '7 days';
