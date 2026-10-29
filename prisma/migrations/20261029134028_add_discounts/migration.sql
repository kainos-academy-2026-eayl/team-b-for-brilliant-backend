-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'AMOUNT_OFF');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discountID" TEXT;

-- CreateTable
CREATE TABLE "Discounts" (
    "discountID" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "DiscountType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discounts_pkey" PRIMARY KEY ("discountID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Discounts_code_key" ON "Discounts"("code");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_discountID_fkey" FOREIGN KEY ("discountID") REFERENCES "Discounts"("discountID") ON DELETE SET NULL ON UPDATE CASCADE;
