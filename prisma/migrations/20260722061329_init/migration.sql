-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotifyRequest" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productTitle" TEXT,
    "variantId" TEXT NOT NULL,
    "variantTitle" TEXT,
    "productHandle" TEXT,
    "productImage" TEXT,
    "price" TEXT,
    "comparePrice" TEXT,
    "currency" TEXT,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotifyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "storeName" TEXT,
    "logo" TEXT,
    "primaryColor" TEXT DEFAULT '#111827',
    "senderName" TEXT,
    "senderEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotifyRequest_variantId_idx" ON "NotifyRequest"("variantId");

-- CreateIndex
CREATE INDEX "NotifyRequest_shop_idx" ON "NotifyRequest"("shop");

-- CreateIndex
CREATE INDEX "NotifyRequest_email_idx" ON "NotifyRequest"("email");

-- CreateIndex
CREATE INDEX "NotifyRequest_sent_idx" ON "NotifyRequest"("sent");

-- CreateIndex
CREATE UNIQUE INDEX "NotifyRequest_email_variantId_key" ON "NotifyRequest"("email", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopSettings_shop_key" ON "ShopSettings"("shop");
