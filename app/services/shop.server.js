// notify-me\app\services\shop.server.js
import {
  ensureShopSettings,
  getShopSettings,
  updateShopSettings,
} from "../models/shop-settings.server";

/**
 * Load settings for current shop
 */
export async function loadShopSettings(shop) {
  await ensureShopSettings(shop);

  return await getShopSettings(shop);
}

/**
 * Save settings
 */
export async function saveShopSettings(shop, formData) {
  await ensureShopSettings(shop);

  const data = {
    storeName: formData.get("storeName")?.trim() || "",
    logo: formData.get("logo")?.trim() || "",
    primaryColor: formData.get("primaryColor") || "#111827",
    senderName: formData.get("senderName")?.trim() || "",
    senderEmail: formData.get("senderEmail")?.trim() || "",
  };

  return await updateShopSettings(shop, data);
}

/**
 * Update only branding
 */
export async function updateBranding(shop, branding) {
  await ensureShopSettings(shop);

  return await updateShopSettings(shop, {
    storeName: branding.storeName,
    logo: branding.logo,
    primaryColor: branding.primaryColor,
  });
}

/**
 * Update sender details
 */
export async function updateSender(shop, sender) {
  await ensureShopSettings(shop);

  return await updateShopSettings(shop, {
    senderName: sender.senderName,
    senderEmail: sender.senderEmail,
  });
}

/**
 * Validate sender email
 */
export function validateSenderEmail(email) {
  if (!email) {
    return {
      valid: false,
      message: "Sender email is required.",
    };
  }

  const regex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!regex.test(email)) {
    return {
      valid: false,
      message: "Please enter a valid email address.",
    };
  }

  return {
    valid: true,
    message: "",
  };
}

/**
 * Validate branding color
 */
export function validateColor(color) {
  return /^#[0-9A-F]{6}$/i.test(color);
}