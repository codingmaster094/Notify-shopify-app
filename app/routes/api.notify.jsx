import prisma from "../db.server";

export async function action({ request }) {
  try {
    const body = await request.json();

    const {
      email,
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

    if (!email || !shop || !productId || !variantId) {
      return Response.json(
        {
          success: false,
          message: "Missing required fields.",
        },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return Response.json(
        {
          success: false,
          message: "Please enter a valid email address.",
        },
        { status: 400 },
      );
    }

    const existing = await prisma.notifyRequest.findUnique({
      where: {
        email_variantId: {
          email,
          variantId,
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

        email,

        productId,
        productTitle,
        productHandle,
        productImage,

        variantId,
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