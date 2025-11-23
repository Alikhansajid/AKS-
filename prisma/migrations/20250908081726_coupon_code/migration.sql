-- AlterTable
ALTER TABLE "public"."cart" ADD COLUMN     "coupon_id" INTEGER;

-- CreateTable
CREATE TABLE "public"."coupon" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "minOrderValue" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "coupon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coupon_public_id_key" ON "public"."coupon"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_code_key" ON "public"."coupon"("code");

-- AddForeignKey
ALTER TABLE "public"."cart" ADD CONSTRAINT "cart_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
