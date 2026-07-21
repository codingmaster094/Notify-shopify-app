// notify-me\app\services\email.server.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Currency Symbol
 */
function currencySymbol(code) {
  switch (code) {
    case "INR":
      return "₹";
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    default:
      return code || "";
  }
}

/**
 * Email HTML
 */
function buildEmailTemplate({
  shopName,
  productTitle,
  variantTitle,
  productImage,
  productUrl,
  price,
  comparePrice,
  currency,
  brandColor,
  buttonText = "Shop Now",
}) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
</head>

<body style="
margin:0;
padding:0;
background:#f5f5f5;
font-family:Arial,sans-serif;
">

<table
width="100%"
cellpadding="0"
cellspacing="0"
>

<tr>

<td align="center">

<table
width="600"
style="
background:#ffffff;
margin:40px auto;
border-radius:12px;
overflow:hidden;
">

<tr>

<td
style="
background:${brandColor || "#111827"};
padding:24px;
text-align:center;
color:#fff;
font-size:22px;
font-weight:bold;
"
>

${shopName}

</td>

</tr>

<tr>

<td
style="
padding:30px;
text-align:center;
"
>

<img
src="${productImage}"
width="220"
style="
border-radius:10px;
margin-bottom:20px;
"
/>

<h2>${productTitle}</h2>

${variantTitle ? `<p style="color:#666;">${variantTitle}</p>` : ""}

<h3>

${currencySymbol(currency)}${price}

${
  comparePrice
    ? `<span style="
color:#999;
text-decoration:line-through;
font-size:16px;
margin-left:10px;
">
${currencySymbol(currency)}${comparePrice}
</span>`
    : ""
}

</h3>

<a
href="${productUrl}"
style="
display:inline-block;
margin-top:20px;
padding:14px 30px;
background:${brandColor || "#111827"};
color:white;
text-decoration:none;
border-radius:8px;
font-weight:bold;
"
>

${buttonText}

</a>

</td>

</tr>

<tr>

<td
style="
padding:20px;
text-align:center;
font-size:13px;
color:#777;
border-top:1px solid #eee;
"
>

You received this email because you subscribed to back in stock notifications.

</td>

</tr>

</table>

</td>

</tr>

</table>

</body>

</html>
`;
}

/**
 * Send Back In Stock Email
 */
export async function sendBackInStockEmail({ to, shopSettings, product }) {
  const html = buildEmailTemplate({
    shopName: shopSettings.storeName || "My Store",

    brandColor: shopSettings.primaryColor,

    productTitle: product.productTitle,

    variantTitle: product.variantTitle,

    productImage: product.productImage,

    productUrl: product.productUrl,

    price: product.price,

    comparePrice: product.comparePrice,

    currency: product.currency,
  });

  return resend.emails.send({
    from: shopSettings.senderEmail || "onboarding@resend.dev",

    to,

    subject: `${product.productTitle} is Back in Stock 🎉`,

    html,
  });
}
