import { Page, BlockStack, Card, DataTable, Text } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useLoaderData } from "react-router";
import DashboardCards from "../components/DashboardCards";

import {
  getTotalSubscribers,
  getPendingCount,
  getEmailsSentCount,
  getTrackedProductsCount,
  getLatestSubscribers,
} from "../models/notify.server";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  const shop = session.shop;

  const [
    totalSubscribers,
    pendingEmails,
    emailsSent,
    trackedProducts,
    latestSubscribers,
  ] = await Promise.all([
    getTotalSubscribers(shop),
    getPendingCount(shop),
    getEmailsSentCount(shop),
    getTrackedProductsCount(shop),
    getLatestSubscribers(shop, 10),
  ]);

  return {
    totalSubscribers,
    pendingEmails,
    emailsSent,
    trackedProducts,
    latestSubscribers,
  };
}

export default function Dashboard() {
  const data = useLoaderData();

  return (
    <Page title="Dashboard">

      <BlockStack gap="500">

        <DashboardCards
          totalSubscribers={data.totalSubscribers}
          pendingEmails={data.pendingEmails}
          emailsSent={data.emailsSent}
          trackedProducts={data.trackedProducts}
        />

        <Card>

          <BlockStack gap="300">

            <Text
              as="h2"
              variant="headingMd"
            >
              Recent Subscribers
            </Text>

            <DataTable
              columnContentTypes={[
                "text",
                "text",
                "text",
                "text",
              ]}
              headings={[
                "Contact",
                "Product",
                "Variant",
                "Status",
              ]}
              rows={data.latestSubscribers.map((item) => [
                item.email || item.phoneNumber || item.contactValue || "-",
                item.productTitle,
                item.variantTitle,
                item.sent ? "Sent" : "Pending",
              ])}
            />

          </BlockStack>

        </Card>

      </BlockStack>

    </Page>
  );
}