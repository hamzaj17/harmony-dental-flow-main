import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
export function PageShell({
  children,
  dashboard = false,
}: {
  children: ReactNode;
  dashboard?: boolean;
}) {
  return (
    <div id="top" className={dashboard ? "admin-app" : "clinic-site"}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {!dashboard && <Navbar />}
      <main id="main">{children}</main>
      {!dashboard && <Footer />}
    </div>
  );
}
export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="wrap page-hero">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {subtitle && <p className="hero-description">{subtitle}</p>}
    </section>
  );
}
