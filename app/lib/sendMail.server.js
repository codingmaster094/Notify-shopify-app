// notify-me\app\lib\sendMail.server.js
import { resend } from "./resend.server.js";

function currencySymbol(code) {
  switch (code) {
    case "USD":
      return "$";
    case "INR":
      return "₹";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    default:
      return code || "";
  }
}

function getValidFromEmail(senderEmail) {
  const candidate = (
    senderEmail ||
    process.env.SENDER_EMAIL ||
    process.env.RESEND_ACCOUNT_EMAIL ||
    process.env.RESEND_FROM ||
    ""
  ).trim();

  // Public webmail domains cannot be used as Resend 'from' address
  const isPublicDomain =
    /@(gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|icloud\.com|aol\.com)$/i.test(
      candidate,
    );

  if (!candidate || isPublicDomain) {
    return "onboarding@resend.dev";
  }
  return candidate;
}

export async function sendBackInStockEmail(
  email,
  productTitle,
  productUrl,
  productImage,
  variantTitle,
  price,
  comparePrice,
  currency,
  senderEmail,
  shopSettings,
) {
  const showCompare =
    comparePrice && comparePrice !== "" && comparePrice !== price;

  const storeName = shopSettings?.storeName || "My Store";
  const brandColor = shopSettings?.primaryColor || "#111827";
  const logoUrl = shopSettings?.logo || "";

  const html = `
  <div style="margin:0;padding:40px;background:#f5f5f5;font-family:Arial,sans-serif;">
    <table align="center" width="600" cellpadding="0" cellspacing="0"
      style="background:#ffffff;border-radius:12px;overflow:hidden;">

      <tr>
        <td style="background:${brandColor};padding:24px;text-align:center;color:#fff;font-size:22px;font-weight:bold;">
          ${logoUrl ? `<img src="${logoUrl}" width="120" style="display:block;margin:0 auto 10px;max-height:50px;object-fit:contain;" />` : ""}
          ${storeName}
        </td>
      </tr>

      <tr>
        <td style="padding:35px;text-align:center;">

          <h1 style="margin:0 0 8px;font-size:28px;">
            Back In Stock!
          </h1>

          <p style="margin:12px 0 30px;color:#666;">
            Great news! The product you requested is available again.
          </p>

          ${
            productImage
              ? `
          <img
            src="${productImage}"
            width="150"
            style="border-radius:12px;margin-bottom:25px;"
          />
          `
              : ""
          }

          <h2 style="margin:0;color:#222;">
            ${productTitle}
          </h2>

          ${
            variantTitle
              ? `
          <p style="color:#777;font-size:15px;">
            ${variantTitle}
          </p>
          `
              : ""
          }

          <div style="margin:20px 0;">

            <span
              style="
                font-size:30px;
                font-weight:bold;
                color:#111;
              "
            >
              ${currencySymbol(currency)}${price || ""}
            </span>

            ${
              showCompare
                ? `
              <span
                style="
                  margin-left:10px;
                  color:#999;
                  text-decoration:line-through;
                  font-size:18px;
                "
              >
                ${currencySymbol(currency)}${comparePrice}
              </span>
            `
                : ""
            }

          </div>

          <a
            href="${productUrl}"
            style="
              display:inline-block;
              background:${brandColor};
              color:#fff;
              padding:15px 35px;
              border-radius:8px;
              text-decoration:none;
              font-weight:bold;
              margin-top:20px;
            "
          >
            Shop Now
          </a>

        </td>
      </tr>

      <tr>
        <td
          style="
            background:#fafafa;
            text-align:center;
            color:#888;
            padding:25px;
            font-size:13px;
          "
        >
          Thank you for subscribing to back in stock notifications.
        </td>
      </tr>

    </table>
  </div>
  `;

  let fromEmail = getValidFromEmail(senderEmail);

  let { data, error } = await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: `${productTitle} Back In Stock`,
    html,
  });

  // If custom domain fails due to unverified domain error, retry with onboarding@resend.dev
  if (error && fromEmail !== "onboarding@resend.dev") {
    console.warn(
      `Resend email with '${fromEmail}' failed (${error.message}). Retrying with 'onboarding@resend.dev'...`,
    );
    fromEmail = "onboarding@resend.dev";
    const retryResult = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `${productTitle} Back In Stock`,
      html,
    });
    data = retryResult.data;
    error = retryResult.error;
  }

  if (error) {
    console.error("Resend email error:", error);
    throw error;
  }

  return data;
}
