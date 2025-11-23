-- AlterTable
ALTER TABLE "public"."product" ADD COLUMN     "details" JSONB,
ADD COLUMN     "isfetch" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sourceUrl" TEXT;
