import handler from "@tanstack/react-start/server-entry";
import { handleClinicRequest } from "../server/clinic.mjs";

export default {
  async fetch(request: Request) {
    const response = (await handleClinicRequest(request)) ?? (await handler.fetch(request));
    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("X-Frame-Options", "DENY");
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (process.env.COOKIE_SECURE === "true" || process.env.SITE_URL?.startsWith("https:"))
      headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
