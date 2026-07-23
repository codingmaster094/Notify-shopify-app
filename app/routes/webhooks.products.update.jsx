import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { sendBackInStockNotifications } from "../lib/notifications.server";

console.log("========== PRODUCTS UPDATE WEBHOOK ==========");
export const action = async ({ request }) => {
  const { payload, topic, shop } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  const productTitle = payload.title;
  const productUrl = `https://${shop}/products/${payload.handle}`;

  for (const variant of payload.variants) {
    const cleanVariantId = String(variant.id).replace(/^gid:\/\/shopify\/ProductVariant\//, "").trim();
    console.log("Webhook Variant ID:", cleanVariantId);
    console.log("Webhook Inventory:", variant.inventory_quantity);

    // Only notify when product is back in stock
    if (variant.inventory_quantity <= 0) {
      continue;
    }

    const subscribers = await prisma.notifyRequest.findMany({
      where: {
        shop,
        variantId: cleanVariantId,
        sent: false,
      },
    });

    console.log("Subscribers found:", subscribers.length);

    if (!subscribers.length) {
      continue;
    }

    const shopSettings = await prisma.shopSettings.findUnique({
      where: { shop },
    });

    for (const user of subscribers) {
      const recipientStr = user.email || user.phoneNumber || user.contactValue;
      try {
        const notificationResult = await sendBackInStockNotifications({
          email: user.email,
          phoneNumber: user.phoneNumber,
          sendEmail: user.contactType !== "phone" && !!user.email,
          sendSms: false,
          sendWhatsApp: user.contactType === "phone" && !!user.phoneNumber,
          productTitle: user.productTitle || productTitle,
          productUrl,
          productImage: user.productImage,
          variantTitle: user.variantTitle,
          price: user.price,
          comparePrice: user.comparePrice,
          currency: user.currency,
          senderEmail: shopSettings?.senderEmail,
          metaAccessToken: shopSettings?.metaAccessToken,
          metaPhoneNumberId: shopSettings?.metaPhoneNumberId,
          metaApiVersion: shopSettings?.metaApiVersion,
        });

        await prisma.notifyRequest.update({
          where: {
            id: user.id,
          },
          data: {
            sent: true,
            emailSentAt: notificationResult.channels.includes("email") ? new Date() : user.emailSentAt,
            smsSentAt: notificationResult.channels.includes("sms") ? new Date() : user.smsSentAt,
            whatsappSentAt: notificationResult.channels.includes("whatsapp") ? new Date() : user.whatsappSentAt,
          },
        });

        console.log(`✅ Notifications sent to ${recipientStr}: ${notificationResult.channels.join(", ") || "none"}`);
      } catch (err) {
        console.error(`❌ Failed for ${recipientStr}`, err);
      }
    }
  }

  return new Response();
};
