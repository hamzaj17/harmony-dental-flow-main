import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
const links = [
  { to: "/#care", label: "Our care" },
  { to: "/#proof", label: "Why trust us" },
  { to: "/#clinic", label: "The clinic" },
  { to: "/#contact", label: "Find us" },
] as const;
export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => setOpen(false), [pathname]);
  return (
    <header className="site-header">
      <div className="wrap nav-inner">
        <Link to="/" className="wordmark" aria-label="Multan Dental and Aesthetics home">
          <span className="brand-symbol" aria-hidden="true">
            m<span>+</span>
          </span>
          <span>
            multan dental<span className="brand-sub">& AESTHETICS</span>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((l) => (
            <a key={l.to} href={l.to}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <Link to="/booking" className="btn btn-small">
            Book a visit <ArrowUpRight size={17} />
          </Link>
          <button
            className="menu-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          className="mobile-nav wrap"
          id="mobile-nav"
          aria-label="Mobile navigation"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        >
          {links.map((l) => (
            <a key={l.to} href={l.to}>
              {l.label}
              <ArrowUpRight size={18} />
            </a>
          ))}
          <a href="tel:+923117594193">0311 7594193</a>
        </nav>
      )}
    </header>
  );
}
