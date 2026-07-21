// notify-me\app\lib\shopify.server.js
export async function graphql(client, query, variables = {}) {
  const response = await client.graphql(query, {
    variables,
  });

  const json = await response.json();

  if (json.errors) {
    throw new Error(JSON.stringify(json.errors));
  }

  return json.data;
}