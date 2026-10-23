-- CreateTable
CREATE TABLE "Customer" (
    "customerID" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "postcode" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("customerID")
);

-- CreateTable
CREATE TABLE "Admin" (
    "adminID" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "postcode" TEXT NOT NULL,
    "roleID" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("adminID")
);

-- CreateTable
CREATE TABLE "Role" (
    "roleID" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "accessLevel" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("roleID")
);

-- CreateTable
CREATE TABLE "BasketItem" (
    "basketItemID" TEXT NOT NULL,
    "customerID" TEXT NOT NULL,
    "productID" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BasketItem_pkey" PRIMARY KEY ("basketItemID")
);

-- CreateTable
CREATE TABLE "Order" (
    "orderID" TEXT NOT NULL,
    "customerID" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("orderID")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "orderItemID" TEXT NOT NULL,
    "orderID" TEXT NOT NULL,
    "productID" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("orderItemID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BasketItem_customerID_productID_key" ON "BasketItem"("customerID", "productID");

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Role"("roleID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BasketItem" ADD CONSTRAINT "BasketItem_customerID_fkey" FOREIGN KEY ("customerID") REFERENCES "Customer"("customerID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BasketItem" ADD CONSTRAINT "BasketItem_productID_fkey" FOREIGN KEY ("productID") REFERENCES "Product"("productID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerID_fkey" FOREIGN KEY ("customerID") REFERENCES "Customer"("customerID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderID_fkey" FOREIGN KEY ("orderID") REFERENCES "Order"("orderID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productID_fkey" FOREIGN KEY ("productID") REFERENCES "Product"("productID") ON DELETE RESTRICT ON UPDATE CASCADE;
