-- CreateEnum
CREATE TYPE "Category" AS ENUM ('WEBSITE', 'WEB_APP', 'MOBILE_APP', 'BRANDING');

-- AlterTable: add column as nullable first so existing rows don't fail
ALTER TABLE "Pricing" ADD COLUMN "category" "Category";

-- Backfill existing rows with a sensible default
UPDATE "Pricing" SET "category" = 'WEBSITE' WHERE "category" IS NULL;

-- Now enforce NOT NULL
ALTER TABLE "Pricing" ALTER COLUMN "category" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Pricing_category_idx" ON "Pricing"("category");
