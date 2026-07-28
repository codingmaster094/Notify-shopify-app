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

// ─── Field & Section Configuration ────────────────────────────────────────────
// To add a new field, just append an entry to the relevant section's `fields`
// array.  To add a whole new section, append a new object to SETTINGS_SECTIONS.
// The form will render everything automatically — no JSX changes required.

const SETTINGS_SECTIONS = [
  {
    key: "branding",
    title: "Store branding",
    description:
      "This information is shown in your back-in-stock notifications.",
    fields: [
      {
        name: "storeName",
        label: "Store name",
        placeholder: "My Awesome Store",
        autoComplete: "organization",
      },
      {
        name: "logo",
        label: "Logo URL",
        placeholder: "https://example.com/logo.png",
        autoComplete: "url",
        helpText: "Paste a public image URL or upload a logo below.",
      },
      // Special "logoUpload" widget is rendered inline — see SPECIAL_FIELDS
      { name: "logoUpload", type: "logoUpload" },
      {
        name: "primaryColor",
        label: "Brand color",
        autoComplete: "off",
        helpText: "Used for the primary action in notification emails.",
        type: "color",
      },
      {
        name: "fontColor",
        label: "Font color",
        autoComplete: "off",
        helpText: "Used for text in notification emails.",
        type: "color",
      },
    ],
  },
  {
    key: "sender",
    title: "Email sender",
    description: "Choose the name and reply address your customers see.",
    fields: [
      {
        name: "senderName",
        label: "Sender name",
        placeholder: "Support team",
        autoComplete: "name",
      },
      {
        name: "senderEmail",
        label: "Sender email",
        placeholder: "support@example.com",
        autoComplete: "email",
        type: "email",
      },
    ],
  },
  {
    key: "whatsapp",
    title: "WhatsApp notifications",
    description: "Optional Meta Cloud API credentials for WhatsApp delivery.",
    fields: [
      {
        name: "metaAccessToken",
        label: "Meta WhatsApp access token",
        placeholder: "Paste your long-lived access token",
        autoComplete: "off",
        type: "password",
      },
      {
        name: "metaPhoneNumberId",
        label: "Meta WhatsApp phone number ID",
        placeholder: "123456789012345",
        autoComplete: "off",
      },
      {
        name: "metaApiVersion",
        label: "Meta Graph API version",
        placeholder: "v22.0",
        autoComplete: "off",
      },
    ],
  },
];

// Default values for every field — used when settings from the DB are empty.
const FIELD_DEFAULTS = {
  storeName: "",
  logo: "",
  primaryColor: "#111827",
  fontColor: "#161B25",
  senderName: "",
  senderEmail: "",
  metaAccessToken: "",
  metaPhoneNumberId: "1100978533109619",
  metaApiVersion: "v22.0",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build initial state from server settings, falling back to FIELD_DEFAULTS. */
const getInitialValues = (settings) => {
  const values = {};
  for (const key of Object.keys(FIELD_DEFAULTS)) {
    values[key] = settings?.[key] ?? FIELD_DEFAULTS[key];
  }
  return values;
};

/** Collect every field `name` that should be submitted as form data. */
const getFormFieldNames = () =>
  SETTINGS_SECTIONS.flatMap((s) =>
    s.fields.filter((f) => f.type !== "logoUpload").map((f) => f.name),
  );

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsForm({
  settings,
  success = false,
  error = "",
  submitting = false,
}) {
  const [values, setValues] = useState(() => getInitialValues(settings));
  const [logoPreview, setLogoPreview] = useState(settings?.logo || "");
  const [selectedLogoName, setSelectedLogoName] = useState("");
  const [showSuccess, setShowSuccess] = useState(success);
  const [showError, setShowError] = useState(Boolean(error));
  const logoFileInput = useRef(null);

  useEffect(() => {
    setValues(getInitialValues(settings));
    setLogoPreview(settings?.logo || "");
    setSelectedLogoName("");
  }, [settings]);

  useEffect(() => setShowSuccess(success), [success]);
  useEffect(() => setShowError(Boolean(error)), [error]);

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

  // ── Renderers for individual field types ──────────────────────────────────

  const renderTextField = (field) => (
    <TextField
      key={field.name}
      label={field.label}
      name={field.name}
      type={field.type || "text"}
      value={values[field.name]}
      onChange={updateValue(field.name)}
      autoComplete={field.autoComplete}
      placeholder={field.placeholder}
      helpText={field.helpText}
    />
  );

  const renderColorField = (field) => (
    <TextField
      key={field.name}
      label={field.label}
      name={field.name}
      value={values[field.name]}
      onChange={updateValue(field.name)}
      autoComplete={field.autoComplete}
      helpText={field.helpText}
      prefix={
        <input
          type="color"
          value={
            /^#[0-9A-F]{6}$/i.test(values[field.name])
              ? values[field.name]
              : "#111827"
          }
          onChange={(event) => updateValue(field.name)(event.target.value)}
          aria-label={`Choose ${field.label.toLowerCase()}`}
          style={{
            width: 28,
            height: 28,
            border: 0,
            background: "transparent",
            padding: 0,
          }}
        />
      }
    />
  );

  const renderLogoUpload = () => (
    <BlockStack key="logoUpload" gap="200">
      <Text as="span" variant="bodyMd" fontWeight="medium">
        Upload logo
      </Text>
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

      {logoPreview && (
        <InlineStack align="space-between" blockAlign="center" wrap={false}>
          <InlineStack gap="300" blockAlign="center" wrap={false}>
            <Box
              padding="200"
              background="bg-surface-secondary"
              borderRadius="200"
            >
              <img
                src={logoPreview}
                alt="Store logo preview"
                style={{
                  display: "block",
                  maxHeight: 48,
                  maxWidth: 160,
                  objectFit: "contain",
                }}
              />
            </Box>
            <Text as="span" tone="subdued">
              Logo preview
            </Text>
          </InlineStack>
          <Button variant="plain" tone="critical" onClick={clearLogo}>
            Remove
          </Button>
        </InlineStack>
      )}
    </BlockStack>
  );

  // ── Dispatch to the right renderer based on field type ────────────────────

  const renderField = (field) => {
    switch (field.type) {
      case "color":
        return renderColorField(field);
      case "logoUpload":
        return renderLogoUpload();
      default:
        return renderTextField(field);
    }
  };

  // ── Render a complete section (heading + description + its fields) ────────

  const renderSection = (section, isLast) => (
    <BlockStack key={section.key} gap="400">
      <BlockStack gap="100">
        <Text as="h2" variant="headingMd">
          {section.title}
        </Text>
        <Text as="p" tone="subdued">
          {section.description}
        </Text>
      </BlockStack>

      {section.fields.map(renderField)}

      {!isLast && <Divider />}
    </BlockStack>
  );

  // ── Main layout ───────────────────────────────────────────────────────────

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

          {showError && (
            <Banner tone="critical" onDismiss={() => setShowError(false)}>
              Logo upload failed: {error}
            </Banner>
          )}

          <Card>
            <BlockStack gap="400">
              {SETTINGS_SECTIONS.map((section, index) =>
                renderSection(section, index === SETTINGS_SECTIONS.length - 1),
              )}

              <InlineStack align="end">
                <Button submit variant="primary" loading={submitting}>
                  Save settings
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </BlockStack>
      </Form>
    </Page>
  );
}
