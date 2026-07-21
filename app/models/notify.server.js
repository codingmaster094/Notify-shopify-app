// notify-me\app\models\notify.server.js
import prisma from "../db.server";

/**
 * Create a new notify request
 */
export async function createNotifyRequest(data) {
  return prisma.notifyRequest.create({
    data,
  });
}

/**
 * Check duplicate subscription
 */
export async function findNotifyRequest(email, variantId) {
  return prisma.notifyRequest.findUnique({
    where: {
      email_variantId: {
        email,
        variantId,
      },
    },
  });
}

/**
 * Get all subscribers for a shop
 */
export async function getSubscribers(shop) {
  return prisma.notifyRequest.findMany({
    where: {
      shop,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Get pending subscribers for a variant
 */
export async function getPendingSubscribers(shop, variantId) {
  return prisma.notifyRequest.findMany({
    where: {
      shop,
      variantId,
      sent: false,
    },
  });
}

/**
 * Mark notification as sent
 */
export async function markAsSent(id) {
  return prisma.notifyRequest.update({
    where: {
      id,
    },
    data: {
      sent: true,
      emailSentAt: new Date(),
    },
  });
}

/**
 * Dashboard Statistics
 */

export async function getTotalSubscribers(shop) {
  return prisma.notifyRequest.count({
    where: {
      shop,
    },
  });
}

export async function getPendingCount(shop) {
  return prisma.notifyRequest.count({
    where: {
      shop,
      sent: false,
    },
  });
}

export async function getEmailsSentCount(shop) {
  return prisma.notifyRequest.count({
    where: {
      shop,
      sent: true,
    },
  });
}

export async function getTrackedProductsCount(shop) {
  const result = await prisma.notifyRequest.findMany({
    where: {
      shop,
    },
    distinct: ["productId"],
    select: {
      productId: true,
    },
  });

  return result.length;
}

/**
 * Latest subscribers
 */
export async function getLatestSubscribers(shop, limit = 10) {
  return prisma.notifyRequest.findMany({
    where: {
      shop,
    },
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Search subscribers
 */
export async function searchSubscribers(shop, keyword) {
  return prisma.notifyRequest.findMany({
    where: {
      shop,
      OR: [
        {
          email: {
            contains: keyword,
            mode: "insensitive",
          },
        },
        {
          productTitle: {
            contains: keyword,
            mode: "insensitive",
          },
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Delete subscriber
 */
export async function deleteSubscriber(id) {
  return prisma.notifyRequest.delete({
    where: {
      id,
    },
  });
}