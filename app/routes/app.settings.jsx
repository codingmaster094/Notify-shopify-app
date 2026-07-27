import { useLoaderData, useActionData, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";
import {
  loadShopSettings,
  saveShopSettings,
} from "../services/shop.server";

import SettingsForm from "../components/SettingsForm";

export async function loader({ request }) {
  const { session, admin } = await authenticate.admin(request);

  return await loadShopSettings(session.shop, admin);
}

export async function action({ request }) {
  const { session, admin } = await authenticate.admin(request);

  const formData = await request.formData();

  await saveShopSettings(session.shop, formData, admin);

  return {
    success: true,
  };
}

export default function SettingsPage() {
  const settings = useLoaderData();
  const action = useActionData();
  const navigation = useNavigation();

  return (
    <SettingsForm
      settings={settings}
      success={action?.success}
      submitting={navigation.state === "submitting"}
    />
  );
}
