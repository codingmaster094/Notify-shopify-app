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
  const showVariantTitle =
    variantTitle && variantTitle.trim().toLowerCase() !== "default title";

  const storeName = shopSettings?.storeName?.trim() || "";
  const brandColor = shopSettings?.primaryColor || "#111827";
  const fontColor = shopSettings?.fontColor || "#161B25";
  const logoUrl = shopSettings?.logo || "";
  const headerContent = storeName
    ? storeName
    : logoUrl
      ? `<img src="${logoUrl}" width="120" alt="Store logo" style="display:block;margin:0 auto;max-height:50px;object-fit:contain;" />`
      : "My Store";

  const html = `
  <div style="margin:0;padding:40px 16px;background:#f5f7fb;font-family:Arial,sans-serif;">
    <table align="center" width="600" cellpadding="0" cellspacing="0" role="presentation"
      style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(17,24,39,0.08);">

      <tr>
        <td style="background:${brandColor};padding:22px 24px;text-align:center;color:#fff;font-size:22px;font-weight:bold;">
          ${headerContent}
        </td>
      </tr>

      <tr>
        <td style="padding:40px 32px;text-align:center;">

          <h1 style="margin:0 0 14px;font-size:28px;line-height:36px;color:${fontColor};">
            Back In Stock!
          </h1>

          <p style="margin:0 auto 30px;max-width:460px;color:${fontColor};font-size:16px;line-height:24px;">
            Hi! Great news, <strong style="color:${fontColor};">${productTitle}</strong> is now back in stock. Check it out before it sells out again!
          </p>

          <table align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation"
            style="margin:0 0 30px;background:#f7f9fc;border:1px solid #e7ebf2;border-radius:14px;">
            <tr>
              <td style="padding:26px 20px 12px;text-align:center;">
                ${
                  productImage
                    ? `<img src="${productImage}" width="190" alt="${productTitle}" style="display:block;width:190px;max-width:100%;height:190px;object-fit:contain;margin:0 auto;" />`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="padding:8px 24px 26px;text-align:center;">
                <h2 style="margin:0;color:${fontColor};font-size:20px;line-height:28px;">${productTitle}</h2>
                ${
                  showVariantTitle
                    ? `<p style="margin:7px 0 0;color:${fontColor};font-size:14px;line-height:20px;">${variantTitle}</p>`
                    : ""
                }
                <p style="margin:16px 0 0;color:${fontColor};font-size:26px;line-height:32px;font-weight:700;">
                  ${currencySymbol(currency)}${price || ""}
                  ${
                    showCompare
                      ? `<span style="margin-left:8px;color:#8b93a1;text-decoration:line-through;font-size:15px;font-weight:400;white-space:nowrap;">${currencySymbol(currency)}${comparePrice}</span>`
                      : ""
                  }
                </p>
              </td>
            </tr>
          </table>

          <a
            href="${productUrl}"
            style="
              display:inline-block;
              background:${brandColor};
              color:#000000;
              padding:14px 32px;
              border-radius:9px;
              text-decoration:none;
              font-weight:bold;
              font-size:15px;
            "
          >
            View product
          </a>

        </td>
      </tr>

      <tr>
        <td
          style="
            background:#f7f9fc;
            text-align:center;
            color:${fontColor};
            padding:22px;
            font-size:12px;
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
