import {
  IndexTable,
  Badge,
  Button,
  Text,
  useIndexResourceState,
} from "@shopify/polaris";

export default function SubscribersTable({
  subscribers = [],
  onDelete,
}) {
  const resourceName = {
    singular: "subscriber",
    plural: "subscribers",
  };

  const {
    selectedResources,
    allResourcesSelected,
    handleSelectionChange,
  } = useIndexResourceState(subscribers);

  const rowMarkup = subscribers.map((subscriber, index) => (
    <IndexTable.Row
      id={subscriber.id}
      key={subscriber.id}
      selected={selectedResources.includes(subscriber.id)}
      position={index}
    >
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd" fontWeight="medium">
          {subscriber.email}
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        {subscriber.productTitle}
      </IndexTable.Cell>

      <IndexTable.Cell>
        {subscriber.variantTitle || "-"}
      </IndexTable.Cell>

      <IndexTable.Cell>
        {subscriber.sent ? (
          <Badge tone="success">Sent</Badge>
        ) : (
          <Badge tone="attention">Pending</Badge>
        )}
      </IndexTable.Cell>

      <IndexTable.Cell>
        {new Date(subscriber.createdAt).toLocaleDateString()}
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Button
          tone="critical"
          variant="plain"
          onClick={() => onDelete?.(subscriber.id)}
        >
          Delete
        </Button>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <IndexTable
      resourceName={resourceName}
      itemCount={subscribers.length}
      selectedItemsCount={
        allResourcesSelected
          ? "All"
          : selectedResources.length
      }
      onSelectionChange={handleSelectionChange}
      headings={[
        { title: "Email" },
        { title: "Product" },
        { title: "Variant" },
        { title: "Status" },
        { title: "Subscribed" },
        { title: "Action" },
      ]}
    >
      {rowMarkup}
    </IndexTable>
  );
}