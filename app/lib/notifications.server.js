import { sendBackInStockEmail } from "./sendMail.server";

function normalizePhoneNumber(phoneNumber) {
  const value = (phoneNumber || "").trim();

  if (!value) {
    return "";
  }

  const cleaned = value.replace(/[^\d+]/g, "");

  if (!cleaned) {
    return "";
  }

  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  return `+${cleaned}`;
}

async function sendMetaWhatsAppMessage({
  to,
  body,
  accessToken,
  phoneNumberId,
  apiVersion,
}) {
  if (!accessToken || !phoneNumberId) {
    throw new Error("Meta WhatsApp API is not configured");
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: {
      body,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(
      `Meta WhatsApp API failed: ${json?.error?.message || "Unknown error"}`,
    );
  }

  return json;
}

export async function sendBackInStockNotifications({
  email,
  phoneNumber,
  sendEmail,
  sendSms,
  sendWhatsApp,
  productTitle,
  productUrl,
  productImage,
  variantTitle,
  price,
  comparePrice,
  currency,
  metaAccessToken,
  metaPhoneNumberId,
  metaApiVersion,
}) {
  const enabledChannels = [];
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  if (sendEmail && email) {
    await sendBackInStockEmail(
      email,
      productTitle,
      productUrl,
      productImage,
      variantTitle,
      price,
      comparePrice,
      currency,
    );

    enabledChannels.push("email");
  }

  const resolvedMetaAccessToken = metaAccessToken || process.env.META_WHATSAPP_ACCESS_TOKEN;
  const resolvedMetaPhoneNumberId = metaPhoneNumberId || process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const resolvedMetaApiVersion = metaApiVersion || process.env.META_API_VERSION || "v22.0";

  if (sendWhatsApp && normalizedPhone) {
    if (!resolvedMetaAccessToken || !resolvedMetaPhoneNumberId) {
      console.warn(
        "Meta WhatsApp credentials are not configured, skipping WhatsApp notification",
      );
    } else {
      const message = `Hi! ${productTitle} is back in stock. You can buy it here: ${productUrl}`;

      await sendMetaWhatsAppMessage({
        to: normalizedPhone,
        body: message,
        accessToken: resolvedMetaAccessToken,
        phoneNumberId: resolvedMetaPhoneNumberId,
        apiVersion: resolvedMetaApiVersion,
      });

      enabledChannels.push("whatsapp");
    }
  }

  if (sendSms && normalizedPhone) {
    console.warn("SMS delivery is not enabled in this Meta-based setup");
  }

  return {
    delivered: enabledChannels.length > 0,
    channels: enabledChannels,
  };
}
