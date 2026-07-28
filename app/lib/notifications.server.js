import { sendBackInStockEmail } from "./sendMail.server";

function normalizePhoneNumber(phoneNumber) {
  const value = (phoneNumber || "").trim();

  if (!value) {
    return "";
  }

  // Remove all non-digit characters (+, spaces, hyphens, etc.)
  let digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  // If 11 digits and starts with 0 (e.g. 09876543210), strip the leading zero
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // If 10 digits (e.g. 9876543210), default to adding country code 91 (India)
  if (digits.length === 10) {
    return `91${digits}`;
  }

  return digits;
}

async function sendMetaWhatsAppMessage({
  to,
  body,
  accessToken,
  phoneNumberId,
  apiVersion,
  productTitle,
  productUrl,
}) {
  if (!accessToken || !phoneNumberId) {
    throw new Error("Meta WhatsApp API is not configured");
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  const templateName = (process.env.META_WHATSAPP_TEMPLATE_NAME || "back_in_stock").trim();
  const templateLang = (process.env.META_WHATSAPP_TEMPLATE_LANG || "en").trim();

  const components = [];
  if (productTitle) {
    components.push({
      type: "body",
      parameters: [
        { type: "text", text: productTitle },
      ],
    });
  }

  const templatePayload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: templateLang,
      },
      ...(components.length > 0 ? { components } : {}),
    },
  };

  console.log(`Sending Meta WhatsApp template '${templateName}' to ${to}...`);

  let response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(templatePayload),
  });

  let json = await response.json();

  // If template fails (e.g. template does not exist), fallback to freeform text message
  if (!response.ok) {
    console.warn(`Template message failed (${json?.error?.message}). Falling back to text message...`);

    const textPayload = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { 
        body, 
      },
    };

    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(textPayload),
    });

    json = await response.json();
  }

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
  sendEmail = true,
  sendSms,
  sendWhatsApp = true,
  productTitle,
  productUrl,
  productImage,
  variantTitle,
  price,
  comparePrice,
  currency,
  senderEmail,
  metaAccessToken,
  metaPhoneNumberId,
  metaApiVersion,
}) {
  const enabledChannels = [];

  const targetEmail = email || process.env.OWNER_EMAIL || "gawaledipak109@gmail.com";
  const targetPhone = phoneNumber || process.env.OWNER_PHONE || "918160711253";
  const normalizedPhone = normalizePhoneNumber(targetPhone);

  if (sendEmail && targetEmail) {
    try {
      await sendBackInStockEmail(
        targetEmail,
        productTitle,
        productUrl,
        productImage,
        variantTitle,
        price,
        comparePrice,
        currency,
        senderEmail,
      );

      enabledChannels.push("email");
    } catch (err) {
      console.error("Failed to send email to", targetEmail, err);
    }
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

      try {
        await sendMetaWhatsAppMessage({
          to: normalizedPhone,
          body: message,
          accessToken: resolvedMetaAccessToken,
          phoneNumberId: resolvedMetaPhoneNumberId,
          apiVersion: resolvedMetaApiVersion,
          productTitle,
          productUrl,
        });

        enabledChannels.push("whatsapp");
      } catch (err) {
        console.error("Failed to send WhatsApp message to", normalizedPhone, err);
        throw err;
      }
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
