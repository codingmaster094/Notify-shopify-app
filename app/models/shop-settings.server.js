// notify-me\app\models\shop-settings.server.js
import prisma from "../db.server";

/**
 * Create default settings for a shop if they don't exist
 */
export async function ensureShopSettings(shop) {
  let settings = await prisma.shopSettings.findUnique({
    where: {
      shop,
    },
  });

  if (!settings) {
    settings = await prisma.shopSettings.create({
      data: {
        shop,
        storeName: shop,
        logo: "",
        primaryColor: "#111827",
        fontColor: "#161B25",
        senderName: "",
        senderEmail: "",
        metaAccessToken: "",
        metaPhoneNumberId: "",
        metaApiVersion: "v22.0",
      },
    });
  }

  return settings;
}

/**
 * Get shop settings
 */
export async function getShopSettings(shop) {
  return prisma.shopSettings.findUnique({
    where: {
      shop,
    },
  });
}

/**
 * Update shop settings
 */
export async function updateShopSettings(shop, data) {
  return prisma.shopSettings.update({
    where: {
      shop,
    },
    data,
  });
}

/**
 * Delete shop settings
 */
export async function deleteShopSettings(shop) {
  return prisma.shopSettings.delete({
    where: {
      shop,
    },
  });
}

/**
 * Check if shop exists
 */
export async function shopExists(shop) {
  const count = await prisma.shopSettings.count({
    where: {
      shop,
    },
  });

  return count > 0;
}

/**
 * Get all installed shops
 * Useful for future cron jobs, analytics, etc.
 */
export async function getAllShops() {
  return prisma.shopSettings.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}
