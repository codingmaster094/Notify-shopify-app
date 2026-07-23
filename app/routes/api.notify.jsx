import prisma from "../db.server";

export async function action({ request }) {
  try {
    const body = await request.json();

    const {
      email,
      phoneNumber,
      shop,

      productId,
      productTitle,
      productHandle,
      productImage,

      variantId,
      variantTitle,

      price,
      comparePrice,
      currency,
    } = body;

    if (!shop || !productId || !variantId) {
      return Response.json(
        {
          success: false,
          message: "Missing required fields.",
        },
        { status: 400 },
      );
    }

    const cleanVariantId = String(variantId).replace(/^gid:\/\/shopify\/ProductVariant\//, "").trim();
    const cleanProductId = String(productId).replace(/^gid:\/\/shopify\/Product\//, "").trim();

    const normalizedEmail = (email || "").trim().toLowerCase();
    const normalizedPhoneNumber = (phoneNumber || "").trim();
    const phoneRegex = /^\+?[\d\s-]{10,15}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!normalizedEmail && !normalizedPhoneNumber) {
      return Response.json(
        {
          success: false,
          message: "Please enter either an email address or a phone number.",
        },
        { status: 400 },
      );
    }

    if (normalizedEmail && !emailRegex.test(normalizedEmail)) {
      return Response.json(
        {
          success: false,
          message: "Please enter a valid email address.",
        },
        { status: 400 },
      );
    }

    if (normalizedPhoneNumber && !phoneRegex.test(normalizedPhoneNumber)) {
      return Response.json(
        {
          success: false,
          message: "Please enter a valid phone number for WhatsApp notifications.",
        },
        { status: 400 },
      );
    }

    const contactValue = normalizedEmail || normalizedPhoneNumber;
    const contactType = normalizedEmail ? "email" : "phone";

    const existing = await prisma.notifyRequest.findUnique({
      where: {
        contactValue_variantId: {
          contactValue,
          variantId: cleanVariantId,
        },
      },
    });

    if (existing) {
      return Response.json(
        {
          success: false,
          message: "You have already subscribed.",
        },
        { status: 409 },
      );
    }

    const notify = await prisma.notifyRequest.create({
      data: {
        shop,

        email: normalizedEmail || null,
        phoneNumber: normalizedPhoneNumber || null,
        contactValue,
        contactType,

        productId: cleanProductId,
        productTitle,
        productHandle,
        productImage,

        variantId: cleanVariantId,
        variantTitle,

        price,
        comparePrice,
        currency,
      },
    });

    console.log("Saved:", notify);

    return Response.json({
      success: true,
      message: "Subscribed successfully.",
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      {
        status: 500,
      },
    );
  }
}