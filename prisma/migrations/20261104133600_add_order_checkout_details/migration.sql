-- AlterTable
ALTER TABLE "Order"
    ADD COLUMN "deliveryFirstname" TEXT,
    ADD COLUMN "deliverySurname" TEXT,
    ADD COLUMN "deliveryAddressLine1" TEXT,
    ADD COLUMN "deliveryAddressLine2" TEXT,
    ADD COLUMN "deliveryPostcode" TEXT,
    ADD COLUMN "deliveryCharge" DECIMAL(10,2),
    ADD COLUMN "discountAmount" DECIMAL(10,2),
    ADD COLUMN "paymentStatus" TEXT,
    ADD COLUMN "cardLast4" TEXT;
