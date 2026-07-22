// notify-me\app\services\shop.server.js
import {
  ensureShopSettings,
  getShopSettings,
  updateShopSettings,
} from "../models/shop-settings.server";

import { graphql } from "../lib/shopify.server";

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
export async function saveShopSettings(shop, formData, admin) {
  await ensureShopSettings(shop);

  const data = {
    storeName: formData.get("storeName")?.trim() || "",
    logo: formData.get("logo")?.trim() || "",
    primaryColor: formData.get("primaryColor") || "#111827",
    senderName: formData.get("senderName")?.trim() || "",
    senderEmail: formData.get("senderEmail")?.trim() || "",
  };

  // If a file was uploaded via the form, upload it to Shopify Files using the admin client
  const logoFile = formData.get("logo_file");
  if (logoFile && typeof logoFile.arrayBuffer === "function" && admin) {
    try {
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      const base64 = buffer.toString("base64");

      const mutation = `#graphql
        mutation fileCreate($files: [FileCreateInput!]!) {
          fileCreate(files: $files) {
            files { id url }
            userErrors { field message }
          }
        }
      `;

      const variables = {
        files: [
          {
            filename: logoFile.name || "logo.png",
            contentType: logoFile.type || "image/png",
            content: base64,
          },
        ],
      };

      const result = await graphql(admin, mutation, variables);

      const fileCreate = result?.fileCreate;
      if (fileCreate?.userErrors && fileCreate.userErrors.length) {
        console.warn("Shopify fileCreate errors:", fileCreate.userErrors);
      } else if (fileCreate?.files && fileCreate.files.length) {
        data.logo = fileCreate.files[0].url;
      }
    } catch (err) {
      console.warn("Logo upload failed:", err);
    }
  }

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