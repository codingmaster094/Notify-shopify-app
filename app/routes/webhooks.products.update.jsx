import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { sendBackInStockEmail } from "../lib/sendMail.server";

console.log("========== PRODUCTS UPDATE WEBHOOK ==========");
export const action = async ({ request }) => {
  const { payload, topic, shop } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  const productTitle = payload.title;
  const productUrl = `https://${shop}/products/${payload.handle}`;

  for (const variant of payload.variants) {
    console.log("Webhook Variant:", variant.id);
    console.log("Webhook Inventory:", variant.inventory_quantity);

    // Only notify when product is back in stock
    if (variant.inventory_quantity <= 0) {
      continue;
    }

    const subscribers = await prisma.notifyRequest.findMany({
      where: {
        shop,
        variantId: variant.id.toString(),
        sent: false,
      },
    });

    console.log("Variant ID:", variant.id.toString());
    console.log("Subscribers:", subscribers);

    if (!subscribers.length) {
      continue;
    }

    for (const user of subscribers) {
      try {
        console.log("Sending email to:", user.email);
        await sendBackInStockEmail(
          user.email,
          user.productTitle || productTitle,
          productUrl,
          user.productImage,
          user.variantTitle,
          user.price,
          user.comparePrice,
          user.currency,
        );

        console.log("user.productImage", user.productImage);
        await prisma.notifyRequest.update({
          where: {
            id: user.id,
          },
          data: {
            sent: true,
            emailSentAt: new Date(),
          },
        });

        console.log(`✅ Email sent to ${user.email}`);
      } catch (err) {
        console.error(`❌ Failed for ${user.email}`, err);
      }
    }
  }

  return new Response();
};
