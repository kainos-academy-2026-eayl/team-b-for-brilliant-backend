CREATE TABLE "Customer" (
    "customerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("customerId")
);

CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");
