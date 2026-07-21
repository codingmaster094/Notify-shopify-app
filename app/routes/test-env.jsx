export async function loader() {
  return Response.json({
    resend: process.env.RESEND_API_KEY ?? null,
    hasKey: !!process.env.RESEND_API_KEY,
    length: process.env.RESEND_API_KEY?.length ?? 0,
  });
}   