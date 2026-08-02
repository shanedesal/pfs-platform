-- Backfill any existing NULLs before enforcing NOT NULL (barangay is now required).
UPDATE "Address" SET "addressLine2" = '' WHERE "addressLine2" IS NULL;

-- AlterTable
ALTER TABLE "Address" ALTER COLUMN "addressLine2" SET NOT NULL;
