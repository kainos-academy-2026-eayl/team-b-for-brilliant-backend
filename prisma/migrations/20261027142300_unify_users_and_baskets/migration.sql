BEGIN;

-- Refuse ambiguous account merges rather than silently losing an account.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM "Customer" c JOIN "Admin" a
        ON c."customerID" = a."adminID" OR c."email" = a."email"
    ) THEN
        RAISE EXCEPTION 'Customer and Admin accounts have conflicting IDs or email addresses; resolve them before migrating';
    END IF;
END $$;

DROP TABLE "EmailVerificationToken";

ALTER TABLE "Customer" RENAME TO "User";
ALTER TABLE "User" RENAME COLUMN "customerID" TO "userID";
ALTER TABLE "User" RENAME CONSTRAINT "Customer_pkey" TO "User_pkey";
ALTER INDEX "Customer_email_key" RENAME TO "User_email_key";
ALTER TABLE "User"
    DROP COLUMN "emailVerified",
    DROP COLUMN "mfaEnabled",
    ADD COLUMN "roleID" TEXT,
    ADD COLUMN "securityQuestionID" TEXT,
    ADD COLUMN "securityAnswer" TEXT;

INSERT INTO "User" (
    "userID", "email", "firstname", "surname", "addressLine1",
    "addressLine2", "postcode", "passwordHash", "createdAt", "roleID"
)
SELECT
    "adminID", "email", "firstname", "surname", "addressLine1",
    "addressLine2", "postcode", "passwordHash", "createdAt", "roleID"
FROM "Admin";

DROP TABLE "Admin";

CREATE TABLE "SecurityQuestion" (
    "questionID" TEXT NOT NULL,
    "question" TEXT NOT NULL,

    CONSTRAINT "SecurityQuestion_pkey" PRIMARY KEY ("questionID")
);

ALTER TABLE "User" ADD CONSTRAINT "User_roleID_fkey"
FOREIGN KEY ("roleID") REFERENCES "Role"("roleID") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_securityQuestionID_fkey"
FOREIGN KEY ("securityQuestionID") REFERENCES "SecurityQuestion"("questionID") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BasketItem" RENAME TO "Basket";
ALTER TABLE "Basket" RENAME COLUMN "basketItemID" TO "basketID";
ALTER TABLE "Basket" RENAME COLUMN "customerID" TO "userID";
ALTER TABLE "Basket" RENAME CONSTRAINT "BasketItem_pkey" TO "Basket_pkey";
ALTER TABLE "Basket" RENAME CONSTRAINT "BasketItem_customerID_fkey" TO "Basket_userID_fkey";
ALTER TABLE "Basket" RENAME CONSTRAINT "BasketItem_productID_fkey" TO "Basket_productID_fkey";
ALTER INDEX "BasketItem_customerID_productID_key" RENAME TO "Basket_userID_productID_key";

ALTER TABLE "Order" RENAME COLUMN "customerID" TO "userID";
ALTER TABLE "Order" RENAME CONSTRAINT "Order_customerID_fkey" TO "Order_userID_fkey";

COMMIT;
