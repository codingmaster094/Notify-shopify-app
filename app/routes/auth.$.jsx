import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { ensureShopSettings } from "../models/shop-settings.server";
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  await ensureShopSettings(session.shop);

  return null;
};

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
