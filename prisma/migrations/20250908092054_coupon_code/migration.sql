/*
  Warnings:

  - You are about to drop the column `created_at` on the `coupon` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `coupon` table. All the data in the column will be lost.
  - You are about to drop the column `public_id` on the `coupon` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `coupon` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[publicId]` on the table `coupon` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `publicId` to the `coupon` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `coupon` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."coupon_public_id_key";

-- AlterTable
ALTER TABLE "public"."coupon" DROP COLUMN "created_at",
DROP COLUMN "deleted_at",
DROP COLUMN "public_id",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "publicId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "coupon_publicId_key" ON "public"."coupon"("publicId");
