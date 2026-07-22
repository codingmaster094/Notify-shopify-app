
// notify-me\app\components

import { useState } from "react";
import { Form } from "react-router";
import {
  Page,
  Card,
  BlockStack,
  TextField,
  Button,
  Banner,
  InlineStack,
} from "@shopify/polaris";

export default function SettingsForm({
  settings,
  success = false,
  submitting = false,
}) {
  const [storeName, setStoreName] = useState(settings?.storeName || "");
  const [logo, setLogo] = useState(settings?.logo || "");
  const [primaryColor, setPrimaryColor] = useState(
    settings?.primaryColor || "#111827"
  );
  const [senderName, setSenderName] = useState(
    settings?.senderName || ""
  );
  const [senderEmail, setSenderEmail] = useState(
    settings?.senderEmail || ""
  );

  return (
    <Page
      title="Settings"
      subtitle="Manage your app branding and email configuration"
    >
      <Form method="post" encType="multipart/form-data">

        <BlockStack gap="400">

          {success && (
            <Banner tone="success">
              Your settings have been saved successfully.
            </Banner>
          )}

          <Card>

            <BlockStack gap="400">

              <TextField
                label="Store Name"
                name="storeName"
                value={storeName}
                onChange={setStoreName}
                autoComplete="off"
                placeholder="My Awesome Store"
              />

              <TextField
                label="Logo URL"
                name="logo"
                value={logo}
                onChange={setLogo}
                autoComplete="off"
                placeholder="https://..."
                helpText="We'll replace this with Shopify File Upload later."
              />

              <div>
                <label style={{ display: "block", marginTop: 8, marginBottom: 6 }}>
                  Upload logo
                </label>
                <input type="file" name="logo_file" accept="image/*" />
              </div>

              {logo ? (
                <div style={{ marginTop: 8 }}>
                  <label style={{ display: "block", marginBottom: 6 }}>Current logo</label>
                  <img src={logo} alt="logo" style={{ maxHeight: 64 }} />
                </div>
              ) : null}
              <TextField
                label="Brand Color"
                name="primaryColor"
                value={primaryColor}
                onChange={setPrimaryColor}
                autoComplete="off"
                placeholder="#111827"
              />

              <TextField
                label="Sender Name"
                name="senderName"
                value={senderName}
                onChange={setSenderName}
                autoComplete="off"
                placeholder="Support Team"
              />

              <TextField
                label="Sender Email"
                type="email"
                name="senderEmail"
                value={senderEmail}
                onChange={setSenderEmail}
                autoComplete="email"
                placeholder="support@example.com"
              />

              <InlineStack align="end">
                <Button
                  submit
                  variant="primary"
                  loading={submitting}
                >
                  Save Settings
                </Button>
              </InlineStack>

            </BlockStack>

          </Card>

        </BlockStack>

      </Form>
    </Page>
  );
}