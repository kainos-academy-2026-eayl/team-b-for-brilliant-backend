-- AlterTable
-- Deleted accounts keep their User row (so orders are kept) with these cleared to NULL
ALTER TABLE "User"
    ALTER COLUMN "email" DROP NOT NULL,
    ALTER COLUMN "passwordHash" DROP NOT NULL;
