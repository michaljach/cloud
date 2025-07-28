/*
  Warnings:

  - You are about to alter the column `storageLimit` on the `User` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "storageLimit" SET DATA TYPE INTEGER;
