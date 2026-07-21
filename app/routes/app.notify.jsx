import { useLoaderData } from "react-router";
import prisma from "../db.server";

export async function loader() {
  try {
    const requests = await prisma.notifyRequest.findMany();

    return {
      requests,
    };
  } catch (error) {
    console.error(error);

    return {
      requests: [],
      error: error.message,
    };
  }
}

export default function NotifyPage() {
  const data = useLoaderData();

  return (
    <s-page heading="Notify Requests">
      <s-section>

        <s-heading>Notify Requests</s-heading>

        <s-paragraph>
          Total Requests: {data.requests.length}
        </s-paragraph>

        {data.error && (
          <s-paragraph>
            Error: {data.error}
          </s-paragraph>
        )}

      </s-section>
    </s-page>
  );
}