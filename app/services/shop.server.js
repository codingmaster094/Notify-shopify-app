// notify-me\app\services\shop.server.js
import {
  ensureShopSettings,
  getShopSettings,
  updateShopSettings,
} from "../models/shop-settings.server";

import { graphql } from "../lib/shopify.server";

/**
 * Load settings for current shop and dynamically fetch shop details if default
 */
export async function loadShopSettings(shop, admin) {
  let settings = await ensureShopSettings(shop);

  // Determine which fields still need auto-populating from Shopify API
  const storeNameNeedsPopulate = !settings.storeName || settings.storeName === shop;
  const senderNameNeedsPopulate = !settings.senderName;
  const senderEmailNeedsPopulate = !settings.senderEmail;

  // Only call Shopify API if at least one field genuinely needs filling
  if (admin && (storeNameNeedsPopulate || senderNameNeedsPopulate || senderEmailNeedsPopulate)) {
    try {
      const response = await graphql(
        admin,
        `#graphql
        query getShopDetails {
          shop {
            name
            email
          }
        }
      `
      );

      const shopData = response?.shop;
      if (shopData) {
        const updates = {};

        // Only auto-fill storeName when it is truly blank or still equals the raw shop domain
        if (storeNameNeedsPopulate) {
          updates.storeName = shopData.name || shop;
        }

        // Auto-fill senderName only when it is blank
        if (senderNameNeedsPopulate) {
          updates.senderName = shopData.name || "";
        }

        // Auto-fill senderEmail only when it is blank
        if (senderEmailNeedsPopulate) {
          updates.senderEmail = shopData.email || "";
        }

        if (Object.keys(updates).length > 0) {
          settings = await updateShopSettings(shop, updates);
        }
      }
    } catch (err) {
      console.warn("Could not auto-fetch shop details from Shopify GraphQL:", err);
    }
  }

  return settings;
}

/**
 * Save settings
 */
export async function saveShopSettings(shop, formData, admin) {
  await ensureShopSettings(shop);

  const data = {
    storeName: formData.get("storeName")?.trim() || "",
    logo: formData.get("logo")?.trim() || "",
    primaryColor: formData.get("primaryColor")?.trim() || "#111827",
    senderName: formData.get("senderName")?.trim() || "",
    senderEmail: formData.get("senderEmail")?.trim() || "",
    metaAccessToken: formData.get("metaAccessToken")?.trim() || "",
    metaPhoneNumberId: formData.get("metaPhoneNumberId")?.trim() || "",
    metaApiVersion: formData.get("metaApiVersion")?.trim() || "v22.0",
  };

  // If a file was uploaded via the form, upload it to Shopify Files using the admin client
  const logoFile = formData.get("logo_file");
  if (
    logoFile &&
    typeof logoFile.arrayBuffer === "function" &&
    logoFile.size > 0 &&
    admin
  ) {
    try {
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      const base64 = buffer.toString("base64");
      const mimeType = logoFile.type || "image/png";

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
            contentType: "IMAGE",
            originalSource: `data:${mimeType};base64,${base64}`,
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

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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