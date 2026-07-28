import { authenticate } from "../shopify.server";
import { resend } from "../lib/resend.server";
import { Page, Card, BlockStack, Text, Button, Banner, TextField, Tabs } from "@shopify/polaris";
import { useFetcher } from "react-router";
import { useState } from "react";
import prisma from "../db.server";
import { sendBackInStockNotifications } from "../lib/notifications.server";

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("actionType") || "email";

  if (actionType === "whatsapp") {
    const toPhone = formData.get("toPhone");

    if (!toPhone) {
      return {
        success: false,
        actionType: "whatsapp",
        error: "Please enter a valid phone number with country code (e.g. 919876543210)",
      };
    }

    const shopSettings = await prisma.shopSettings.findUnique({
      where: { shop: session.shop },
    });

    try {
      const result = await sendBackInStockNotifications({
        phoneNumber: toPhone,
        sendWhatsApp: true,
        sendEmail: false,
        productTitle: "Snowboard (Test Product)",
        productUrl: `https://${session.shop}`,
        metaAccessToken: shopSettings?.metaAccessToken,
        metaPhoneNumberId: shopSettings?.metaPhoneNumberId,
        metaApiVersion: shopSettings?.metaApiVersion,
      });

      return {
        success: result.delivered,
        actionType: "whatsapp",
        to: toPhone,
        channels: result.channels,
        error: result.delivered ? null : "WhatsApp delivery failed or credentials missing in Settings.",
      };
    } catch (err) {
      return {
        success: false,
        actionType: "whatsapp",
        to: toPhone,
        error: err.message || "Failed to send WhatsApp message",
      };
    }
  }

  // Default: Email test
  const toEmail = formData.get("toEmail") || "gawaledipak109@gmail.com";

  if (!resend) {
    return {
      success: false,
      actionType: "email",
      error: "RESEND_API_KEY env variable is missing or not loaded",
      from: null,
    };
  }

  const from = "onboarding@resend.dev";

  try {
    const result = await resend.emails.send({
      from,
      to: toEmail,
      subject: "✅ Notify Me — Test Email",
      html: `
        <div style="font-family:Arial,sans-serif;padding:30px;max-width:500px;margin:0 auto;background:#f9f9f9;border-radius:12px;">
          <h2 style="color:#111;">✅ Test Email Working!</h2>
          <p style="color:#444;">If you received this email, your Notify Me app email delivery is working correctly.</p>
          <p style="color:#888;font-size:13px;">Sent from: <strong>${from}</strong><br/>Sent to: <strong>${toEmail}</strong></p>
        </div>
      `,
    });

    if (result.error) {
      return {
        success: false,
        actionType: "email",
        error: result.error.message || JSON.stringify(result.error),
        errorCode: result.error.name,
        from,
        to: toEmail,
        raw: JSON.stringify(result.error),
      };
    }

    return {
      success: true,
      actionType: "email",
      id: result.data?.id,
      from,
      to: toEmail,
    };
  } catch (err) {
    return {
      success: false,
      actionType: "email",
      error: err.message,
      from,
      to: toEmail,
    };
  }
}

export default function TestNotificationsPage() {
  const fetcher = useFetcher();
  const result = fetcher.data;
  const isLoading = fetcher.state !== "idle";

  const [selectedTab, setSelectedTab] = useState(0);
  const [toEmail, setToEmail] = useState("gawaledipak109@gmail.com");
  const [toPhone, setToPhone] = useState("91");

  const tabs = [
    { id: "whatsapp", content: "💬 Test WhatsApp Message" },
    { id: "email", content: "📧 Test Email Delivery" },
  ];

  return (
    <Page title="Test Notifications Delivery">
      <BlockStack gap="500">
        <Banner tone="info">
          <p>
            Use this tool to test live WhatsApp and Email delivery to any phone number or email address.
          </p>
        </Banner>

        <Card padding="0">
          <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
            <div style={{ padding: "20px" }}>
              {selectedTab === 0 ? (
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">Send Test WhatsApp Message</Text>
                  <Text as="p" tone="subdued">
                    Enter any WhatsApp phone number with country code (e.g. <code>919876543210</code> for India).
                  </Text>

                  <TextField
                    label="Recipient WhatsApp Number"
                    value={toPhone}
                    onChange={setToPhone}
                    type="tel"
                    placeholder="919876543210"
                    helpText="Include country code without '+' (e.g. 91 for India)"
                  />

                  <fetcher.Form method="POST">
                    <input type="hidden" name="actionType" value="whatsapp" />
                    <input type="hidden" name="toPhone" value={toPhone} />
                    <Button
                      submit
                      variant="primary"
                      loading={isLoading}
                      disabled={isLoading}
                    >
                      {isLoading ? "Sending WhatsApp..." : "Send Test WhatsApp Message"}
                    </Button>
                  </fetcher.Form>
                </BlockStack>
              ) : (
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">Send Test Email</Text>

                  <TextField
                    label="Send test email to"
                    value={toEmail}
                    onChange={setToEmail}
                    type="email"
                    helpText="Enter the email address you want to test delivery to"
                  />

                  <fetcher.Form method="POST">
                    <input type="hidden" name="actionType" value="email" />
                    <input type="hidden" name="toEmail" value={toEmail} />
                    <Button
                      submit
                      variant="primary"
                      loading={isLoading}
                      disabled={isLoading}
                    >
                      {isLoading ? "Sending..." : "Send Test Email"}
                    </Button>
                  </fetcher.Form>
                </BlockStack>
              )}
            </div>
          </Tabs>
        </Card>

        {result && (
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                {result.actionType === "whatsapp" ? "💬 WhatsApp Result" : "📧 Email Result"}
              </Text>

              {result.success ? (
                <Banner tone="success">
                  <p>✅ {result.actionType === "whatsapp" ? "WhatsApp Message Sent Successfully!" : "Email Sent Successfully!"}</p>
                  <p><strong>Sent To:</strong> {result.to}</p>
                </Banner>
              ) : (
                <Banner tone="critical">
                  <p>❌ {result.actionType === "whatsapp" ? "WhatsApp Failed to Send!" : "Email Failed to Send!"}</p>
                  <p><strong>Error:</strong> {result.error}</p>
                  {result.from && <p><strong>From:</strong> {result.from}</p>}
                  {result.to && <p><strong>To:</strong> {result.to}</p>}
                  {result.raw && (
                    <details style={{ marginTop: "8px" }}>
                      <summary style={{ cursor: "pointer", color: "#555" }}>Full Error Details</summary>
                      <pre style={{ fontSize: "12px", background: "#f5f5f5", padding: "10px", borderRadius: "6px", overflowX: "auto" }}>
                        {result.raw}
                      </pre>
                    </details>
                  )}
                </Banner>
              )}
            </BlockStack>
          </Card>
        )}
      </BlockStack>
    </Page>
  );
}

