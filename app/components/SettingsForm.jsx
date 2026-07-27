import { useEffect, useRef, useState } from "react";
import { Form } from "react-router";
import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Divider,
  InlineStack,
  Page,
  Text,
  TextField,
} from "@shopify/polaris";

const getInitialValues = (settings) => ({
  storeName: settings?.storeName || "",
  logo: settings?.logo || "",
  primaryColor: settings?.primaryColor || "#111827",
  senderName: settings?.senderName || "",
  senderEmail: settings?.senderEmail || "",
  metaAccessToken: settings?.metaAccessToken || "",
  metaPhoneNumberId: settings?.metaPhoneNumberId || "",
  metaApiVersion: settings?.metaApiVersion || "v22.0",
});

export default function SettingsForm({
  settings,
  success = false,
  submitting = false,
}) {
  const [values, setValues] = useState(() => getInitialValues(settings));
  const [logoPreview, setLogoPreview] = useState(settings?.logo || "");
  const [selectedLogoName, setSelectedLogoName] = useState("");
  const [showSuccess, setShowSuccess] = useState(success);
  const logoFileInput = useRef(null);

  useEffect(() => {
    setValues(getInitialValues(settings));
    setLogoPreview(settings?.logo || "");
    setSelectedLogoName("");
  }, [settings]);

  useEffect(() => setShowSuccess(success), [success]);

  useEffect(() => {
    return () => {
      if (logoPreview.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const updateValue = (field) => (value) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (field === "logo" && value) setLogoPreview(value);
  };

  const handleLogoFile = (event) => {
    const file = event.target.files?.[0];
    setSelectedLogoName(file?.name || "");
    if (file) setLogoPreview(URL.createObjectURL(file));
  };

  const clearLogo = () => {
    setValues((current) => ({ ...current, logo: "" }));
    setLogoPreview("");
    setSelectedLogoName("");
    if (logoFileInput.current) logoFileInput.current.value = "";
  };

  return (
    <Page
      title="Settings"
      subtitle="Set up your store branding and notification delivery details."
    >
      <Form method="post" encType="multipart/form-data">
        <BlockStack gap="400">
          {showSuccess && (
            <Banner tone="success" onDismiss={() => setShowSuccess(false)}>
              Settings saved successfully.
            </Banner>
          )}

          <Card>
            <BlockStack gap="400">
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">Store branding</Text>
                <Text as="p" tone="subdued">
                  This information is shown in your back-in-stock notifications.
                </Text>
              </BlockStack>

              <TextField
                label="Store name"
                name="storeName"
                value={values.storeName}
                onChange={updateValue("storeName")}
                autoComplete="organization"
                placeholder="My Awesome Store"
              />

              <TextField
                label="Logo URL"
                name="logo"
                value={values.logo}
                onChange={updateValue("logo")}
                autoComplete="url"
                placeholder="https://example.com/logo.png"
                helpText="Paste a public image URL or upload a logo below."
              />

              <BlockStack gap="200">
                <Text as="span" variant="bodyMd" fontWeight="medium">Upload logo</Text>
                <input
                  id="logo_file"
                  name="logo_file"
                  ref={logoFileInput}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFile}
                  aria-describedby="logo-file-help"
                />
                <Text as="p" tone="subdued" id="logo-file-help">
                  PNG, JPG, GIF, or SVG. The uploaded file takes priority when saved.
                </Text>
                {selectedLogoName && <Text as="p">Selected: {selectedLogoName}</Text>}
              </BlockStack>

              {logoPreview && (
                <InlineStack align="space-between" blockAlign="center" wrap={false}>
                  <InlineStack gap="300" blockAlign="center" wrap={false}>
                    <Box padding="200" background="bg-surface-secondary" borderRadius="200">
                      <img
                        src={logoPreview}
                        alt="Store logo preview"
                        style={{ display: "block", maxHeight: 48, maxWidth: 160, objectFit: "contain" }}
                      />
                    </Box>
                    <Text as="span" tone="subdued">Logo preview</Text>
                  </InlineStack>
                  <Button variant="plain" tone="critical" onClick={clearLogo}>Remove</Button>
                </InlineStack>
              )}

              <TextField
                label="Brand color"
                name="primaryColor"
                value={values.primaryColor}
                onChange={updateValue("primaryColor")}
                autoComplete="off"
                prefix={<input type="color" value={/^#[0-9A-F]{6}$/i.test(values.primaryColor) ? values.primaryColor : "#111827"} onChange={(event) => updateValue("primaryColor")(event.target.value)} aria-label="Choose brand color" style={{ width: 28, height: 28, border: 0, background: "transparent", padding: 0 }} />}
                helpText="Used for the primary action in notification emails."
              />

              <Divider />

              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">Email sender</Text>
                <Text as="p" tone="subdued">Choose the name and reply address your customers see.</Text>
              </BlockStack>
              <TextField label="Sender name" name="senderName" value={values.senderName} onChange={updateValue("senderName")} autoComplete="name" placeholder="Support team" />
              <TextField label="Sender email" type="email" name="senderEmail" value={values.senderEmail} onChange={updateValue("senderEmail")} autoComplete="email" placeholder="support@example.com" />

              <Divider />

              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">WhatsApp notifications</Text>
                <Text as="p" tone="subdued">Optional Meta Cloud API credentials for WhatsApp delivery.</Text>
              </BlockStack>
              <TextField label="Meta WhatsApp access token" type="password" name="metaAccessToken" value={values.metaAccessToken} onChange={updateValue("metaAccessToken")} autoComplete="off" placeholder="Paste your long-lived access token" />
              <TextField label="Meta WhatsApp phone number ID" name="metaPhoneNumberId" value={values.metaPhoneNumberId} onChange={updateValue("metaPhoneNumberId")} autoComplete="off" placeholder="123456789012345" />
              <TextField label="Meta Graph API version" name="metaApiVersion" value={values.metaApiVersion} onChange={updateValue("metaApiVersion")} autoComplete="off" placeholder="v22.0" />

              <InlineStack align="end">
                <Button submit variant="primary" loading={submitting}>Save settings</Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </BlockStack>
      </Form>
    </Page>
  );
}
