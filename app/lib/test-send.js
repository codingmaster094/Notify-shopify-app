// test-send.js
const { Resend } = require("resend");
const key = process.env.RESEND_API_KEY;
if (!key) { console.error("RESEND_API_KEY missing"); process.exit(1); }
const resend = new Resend(key);

(async () => {
  try {
    const r = await resend.emails.send({
      from: "SENDER@YOURDOMAIN.com",   // Settings માં જે Sender Email છે તે જ મૂકવો (અથવા onboarding@resend.dev)
      to: "friend@example.com",        // અહીં friend's email મૂકો
      subject: "Test from Notify Me",
      html: "<strong>Test message — ignore</strong>"
    });
    console.log("Result:", r);
  } catch (err) {
    console.error("Send error:", err);
  }
})();