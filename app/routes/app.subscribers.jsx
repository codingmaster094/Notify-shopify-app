import { useMemo, useState } from "react";

import {
  Page,
  Card,
  BlockStack,
  TextField,
  InlineStack,
  Select,
} from "@shopify/polaris";

import { authenticate } from "../shopify.server";
import { getSubscribers, deleteSubscriber } from "../models/notify.server";

import SubscribersTable from "../components/SubscribersTable";
import { useLoaderData, useFetcher } from "react-router";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const subscribers = await getSubscribers(session.shop);
  return { subscribers };
}

export async function action({ request }) {
  await authenticate.admin(request);
  const formData = await request.formData();
  const id = formData.get("id");
  const intent = formData.get("intent");

  if (intent === "delete" && id) {
    await deleteSubscriber(id);
    return { success: true };
  }

  return { success: false };
}

export default function SubscribersPage() {
  const { subscribers } = useLoaderData();
  const fetcher = useFetcher();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this subscriber?")) return;
    const formData = new FormData();
    formData.append("intent", "delete");
    formData.append("id", id);
    fetcher.submit(formData, { method: "POST" });
  }

  // Optimistically remove deleted subscriber from list
  const deletingId = fetcher.formData?.get("id");
  const activeSubscribers = deletingId
    ? subscribers.filter((s) => s.id !== deletingId)
    : subscribers;

  const statusOptions = [
    {
      label: "All",
      value: "all",
    },
    {
      label: "Pending",
      value: "pending",
    },
    {
      label: "Sent",
      value: "sent",
    },
  ];

  const sortOptions = [
    {
      label: "Newest",
      value: "newest",
    },
    {
      label: "Oldest",
      value: "oldest",
    },
    {
      label: "Email A-Z",
      value: "email-asc",
    },
    {
      label: "Email Z-A",
      value: "email-desc",
    },
  ];

  const filteredSubscribers = useMemo(() => {
    let data = [...activeSubscribers];

    if (search.trim()) {
      const keyword = search.toLowerCase();

      data = data.filter((subscriber) => {
        const contact = (subscriber.email || subscriber.phoneNumber || subscriber.contactValue || "").toLowerCase();
        const title = (subscriber.productTitle || "").toLowerCase();
        return contact.includes(keyword) || title.includes(keyword);
      });
    }

    if (status === "pending") {
      data = data.filter((item) => !item.sent);
    }

    if (status === "sent") {
      data = data.filter((item) => item.sent);
    }

    switch (sortBy) {
      case "oldest":
        data.sort(
          (a, b) =>
            new Date(a.createdAt) -
            new Date(b.createdAt),
        );
        break;

      case "email-asc":
        data.sort((a, b) =>
          (a.email || a.phoneNumber || "").localeCompare(b.email || b.phoneNumber || ""),
        );
        break;

      case "email-desc":
        data.sort((a, b) =>
          (b.email || b.phoneNumber || "").localeCompare(a.email || a.phoneNumber || ""),
        );
        break;

      default:
        data.sort(
          (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt),
        );
    }

    return data;
  }, [subscribers, search, status, sortBy]);

  return (
    <Page title="Subscribers">
      <BlockStack gap="500">
        <Card>
          <BlockStack gap="400">
            <InlineStack gap="300" wrap={false}>
              <div style={{ flex: 1 }}>
                <TextField
                  label="Search"
                  labelHidden
                  placeholder="Search by email or product"
                  value={search}
                  onChange={setSearch}
                  clearButton
                  onClearButtonClick={() => setSearch("")}
                />
              </div>
              <Select
                label="Status"
                labelHidden
                options={statusOptions}
                value={status}
                onChange={setStatus}
              />
              <Select
                label="Sort by"
                labelHidden
                options={sortOptions}
                value={sortBy}
                onChange={setSortBy}
              />
            </InlineStack>
          </BlockStack>
        </Card>

        <Card padding="0">
          <SubscribersTable
            subscribers={filteredSubscribers}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        </Card>
      </BlockStack>
    </Page>
  );
}