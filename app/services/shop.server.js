// notify-me\app\services\shop.server.js
import {
  ensureShopSettings,
  updateShopSettings,
} from "../models/shop-settings.server";

import { graphql } from "../lib/shopify.server";

/**
 * Load settings for current shop and dynamically fetch shop details if default
 */
export async function loadShopSettings(shop, admin) {
  let settings = await ensureShopSettings(shop);

  // Strip protocol from shop just in case, for safe comparison
  const rawDomain = shop.replace(/^https?:\/\//, "").trim();

  // A blank store name is a valid saved choice. Only replace the initial
  // domain-based default; otherwise a user who clears the field would see it
  // reappear after the page reloads.
  const storeNameNeedsPopulate =
    settings.storeName === rawDomain || settings.storeName === shop;

  const senderNameNeedsPopulate = !settings.senderName;
  const senderEmailNeedsPopulate = !settings.senderEmail;

  // Only call Shopify API when at least one field still has a factory/blank value
  if (
    admin &&
    (storeNameNeedsPopulate ||
      senderNameNeedsPopulate ||
      senderEmailNeedsPopulate)
  ) {
    try {
      const response = await graphql(
        admin,
        `
          #graphql
          query getShopDetails {
            shop {
              name
              email
            }
          }
        `,
      );

      const shopData = response?.shop;
      if (shopData) {
        const updates = {};

        // Auto-fill storeName ONLY when it has never been customised
        if (storeNameNeedsPopulate) {
          updates.storeName = shopData.name || rawDomain;
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
      console.warn(
        "Could not auto-fetch shop details from Shopify GraphQL:",
        err,
      );
    }
  }

  return settings;
}

/**
 * Save settings
 */
export async function saveShopSettings(shop, formData, admin) {
  const currentSettings = await ensureShopSettings(shop);

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
      const mimeType = logoFile.type || "image/png";

      const stagedUploadMutation = `#graphql
        mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
          stagedUploadsCreate(input: $input) {
            stagedTargets {
              url
              resourceUrl
              parameters { name value }
            }
            userErrors { field message }
          }
        }
      `;

      const stagedUpload = await graphql(admin, stagedUploadMutation, {
        input: [
          {
            filename: logoFile.name || "logo.png",
            mimeType,
            resource: "IMAGE",
            fileSize: String(buffer.length),
            httpMethod: "POST",
          },
        ],
      });

      const stagedResult = stagedUpload?.stagedUploadsCreate;
      if (
        stagedResult?.userErrors?.length ||
        !stagedResult?.stagedTargets?.[0]
      ) {
        throw new Error(
          stagedResult?.userErrors?.map((error) => error.message).join(", ") ||
            "Could not prepare logo upload.",
        );
      }

      const target = stagedResult.stagedTargets[0];
      const uploadForm = new FormData();
      target.parameters.forEach(({ name, value }) =>
        uploadForm.append(name, value),
      );
      uploadForm.append(
        "file",
        new Blob([buffer], { type: mimeType }),
        logoFile.name || "logo.png",
      );

      const uploadResponse = await fetch(target.url, {
        method: "POST",
        body: uploadForm,
      });

      if (!uploadResponse.ok) {
        throw new Error(
          `Logo upload failed with status ${uploadResponse.status}.`,
        );
      }

      const mutation = `#graphql
        mutation fileCreate($files: [FileCreateInput!]!) {
          fileCreate(files: $files) {
            files {
              id
              ... on MediaImage {
                image { url }
              }
            }
            userErrors { field message }
          }
        }
      `;

      const variables = {
        files: [
          {
            filename: logoFile.name || "logo.png",
            contentType: "IMAGE",
            originalSource: target.resourceUrl,
          },
        ],
      };

      const result = await graphql(admin, mutation, variables);

      const fileCreate = result?.fileCreate;
      if (fileCreate?.userErrors && fileCreate.userErrors.length) {
        throw new Error(
          fileCreate.userErrors.map((error) => error.message).join(", "),
        );
      }

      const uploadedLogoUrl = fileCreate?.files?.[0]?.image?.url;
      if (!uploadedLogoUrl) {
        throw new Error("Shopify did not return a logo URL.");
      }

      data.logo = uploadedLogoUrl;
    } catch (err) {
      console.warn("Logo upload failed:", err);
      // Do not erase the current logo if the replacement upload fails.
      data.logo = currentSettings.logo || "";
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
