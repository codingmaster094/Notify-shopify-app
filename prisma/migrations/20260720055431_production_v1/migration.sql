/*
  Warnings:

  - Added the required column `updatedAt` to the `NotifyRequest` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NotifyRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productTitle" TEXT,
    "variantId" TEXT NOT NULL,
    "variantTitle" TEXT,
    "productHandle" TEXT,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_NotifyRequest" ("createdAt", "email", "id", "productId", "sent", "shop", "variantId") SELECT "createdAt", "email", "id", "productId", "sent", "shop", "variantId" FROM "NotifyRequest";
DROP TABLE "NotifyRequest";
ALTER TABLE "new_NotifyRequest" RENAME TO "NotifyRequest";
CREATE INDEX "NotifyRequest_variantId_idx" ON "NotifyRequest"("variantId");
CREATE INDEX "NotifyRequest_shop_idx" ON "NotifyRequest"("shop");
CREATE INDEX "NotifyRequest_email_idx" ON "NotifyRequest"("email");
CREATE INDEX "NotifyRequest_sent_idx" ON "NotifyRequest"("sent");
CREATE UNIQUE INDEX "NotifyRequest_email_variantId_key" ON "NotifyRequest"("email", "variantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
