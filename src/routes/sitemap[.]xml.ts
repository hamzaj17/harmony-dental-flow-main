import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const origin = (process.env.SITE_URL || new URL(request.url).origin)
          .replace(/\/$/, "")
          .replace(/[<>&"']/g, "");
        const entries = ["/", "/about", "/services", "/contact", "/booking", "/privacy"];
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map((path) => `<url><loc>${origin}${path}</loc></url>`).join("")}</urlset>`,
          { headers: { "Content-Type": "application/xml; charset=utf-8" } },
        );
      },
    },
  },
});
