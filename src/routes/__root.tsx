import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "../styles.css?url";
function NotFound() {
  return (
    <div className="wrap page-hero">
      <p className="eyebrow">404 / NOT FOUND</p>
      <h1>Let’s get you back.</h1>
      <p className="hero-description">We couldn’t find this page.</p>
      <Link to="/" className="btn mt-8">
        Back to the clinic
      </Link>
    </div>
  );
}
function ErrorPage({ reset }: { reset: () => void }) {
  const router = useRouter();
  return (
    <div className="wrap page-hero">
      <h1>Something didn’t load.</h1>
      <p className="hero-description">
        Please try again, or call 0311 7594193 if you need help booking.
      </p>
      <button
        className="btn mt-8"
        onClick={() => {
          void router.invalidate();
          reset();
        }}
      >
        Try again
      </button>
    </div>
  );
}
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#223d31" },
      { title: "Multan Dental & Aesthetics | Dr. Alizay Gull Khan" },
      {
        name: "description",
        content:
          "Dental and aesthetic care with Dr. Alizay Gull Khan in Shalimar Colony, Multan. Book a visit, explore treatments, or contact the clinic.",
      },
      { property: "og:title", content: "Multan Dental & Aesthetics" },
      {
        property: "og:description",
        content: "A little care. A lot more confidence. Dental care in Shalimar Colony, Multan.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/clinic.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "index, follow, max-image-preview:large" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  shellComponent: Shell,
  component: Root,
  notFoundComponent: NotFound,
  errorComponent: ErrorPage,
});
function Shell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
function Root() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
