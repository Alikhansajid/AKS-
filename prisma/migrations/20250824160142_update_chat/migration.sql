-- AlterTable
ALTER TABLE "public"."conversation" ALTER COLUMN "publicId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."message" ALTER COLUMN "publicId" DROP NOT NULL,
ALTER COLUMN "text" DROP NOT NULL;
