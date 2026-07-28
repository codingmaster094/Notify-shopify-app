import { Resend } from "resend";

export function getResend() {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

export const resend = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getResend();
      if (!client) {
        console.error("RESEND_API_KEY is missing or empty in process.env");
        return undefined;
      }
      return client[prop];
    },
  }
);