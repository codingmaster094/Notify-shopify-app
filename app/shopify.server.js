import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
import { getRequiredEnv, requireEnv } from "./utils/env.server";

requireEnv([
  "SHOPIFY_API_KEY",
  "SHOPIFY_API_SECRET",
  "SHOPIFY_APP_URL",
  "SCOPES",
  "DATABASE_URL",
  "RESEND_API_KEY",
  "PORT",
]);

const shopify = shopifyApp({
  apiKey: getRequiredEnv("SHOPIFY_API_KEY"),
  apiSecretKey: getRequiredEnv("SHOPIFY_API_SECRET"),
  apiVersion: ApiVersion.July26,
  scopes: getRequiredEnv("SCOPES").split(","),
  appUrl: getRequiredEnv("SHOPIFY_APP_URL"),
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    expiringOfflineAccessTokens: true,
  },
  customShopDomains: process.env.SHOP_CUSTOM_DOMAIN
    ? [process.env.SHOP_CUSTOM_DOMAIN]
    : undefined,
});

export default shopify;
export const apiVersion = ApiVersion.July26;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
