// notify-me\app\components

import {
  Card,
  InlineGrid,
  BlockStack,
  Text,
} from "@shopify/polaris";

function DashboardCard({
  title,
  value,
  subtitle,
}) {
  return (
    <Card roundedAbove="sm">
      <BlockStack gap="200">
        <Text
          as="h3"
          variant="headingSm"
          tone="subdued"
        >
          {title}
        </Text>

        <Text
          as="p"
          variant="heading2xl"
          fontWeight="bold"
        >
          {value}
        </Text>

        {subtitle && (
          <Text
            as="p"
            variant="bodySm"
            tone="subdued"
          >
            {subtitle}
          </Text>
        )}
      </BlockStack>
    </Card>
  );
}

export default function DashboardCards({
  totalSubscribers = 0,
  pendingEmails = 0,
  emailsSent = 0,
  trackedProducts = 0,
}) {
  return (
    <InlineGrid
      columns={{
        xs: 1,
        sm: 2,
        md: 2,
        lg: 4,
      }}
      gap="400"
    >
      <DashboardCard
        title="Subscribers"
        value={totalSubscribers}
        subtitle="Total registered users"
      />

      <DashboardCard
        title="Pending Emails"
        value={pendingEmails}
        subtitle="Waiting for stock"
      />

      <DashboardCard
        title="Emails Sent"
        value={emailsSent}
        subtitle="Successfully delivered"
      />

      <DashboardCard
        title="Tracked Products"
        value={trackedProducts}
        subtitle="Products with subscribers"
      />
    </InlineGrid>
  );
}