import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { type Settings, rpc } from "@/lib/appointments";
export function ClinicHours() {
  const [hours, setHours] = useState<Settings | null>(null);
  useEffect(() => {
    let active = true;
    rpc<Settings>("settings")
      .then((s) => {
        if (active) setHours(s);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const label = (n: number) => `${n % 12 || 12}${n % 24 < 12 ? "am" : "pm"}`;
  return (
    <span>
      {hours
        ? `${hours.days.length === 7 ? "Every day" : hours.days.map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")} · ${label(hours.opening)}–${label(hours.closing)}`
        : "Call for clinic hours"}
    </span>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-main">
        <div className="footer-intro">
          <p className="eyebrow">A LITTLE CARE GOES A LONG WAY.</p>
          <h2>
            See you
            <br />
            <em>in the chair.</em>
          </h2>
          <Link to="/booking" className="text-link light">
            Make an appointment <ArrowUpRight size={19} />
          </Link>
        </div>
        <div>
          <h3>Come by</h3>
          <p>
            Main Road, Shalimar Colony
            <br />
            Multan, Pakistan
          </p>
          <a
            href="https://www.google.com/maps/search/?api=1&query=6FQM%2BVQR%20Shalimar%20Colony%20Multan"
            target="_blank"
            rel="noreferrer"
            className="text-link light"
          >
            Get directions <ArrowUpRight size={15} />
          </a>
          <p className="footer-hours">
            <ClinicHours />
          </p>
        </div>
        <div>
          <h3>Say hello</h3>
          <a className="footer-phone" href="tel:+923117594193">
            0311 7594193
          </a>
          <a
            href="https://wa.me/923117594193"
            className="text-link light"
            target="_blank"
            rel="noreferrer"
          >
            Chat on WhatsApp <ArrowUpRight size={15} />
          </a>
          <a href="/#contact" className="text-link light">
            Send an enquiry <ArrowUpRight size={15} />
          </a>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>© {new Date().getFullYear()} Multan Dental & Aesthetics</span>
        <div>
          <Link to="/privacy">Privacy</Link>
          <Link to="/owner">Clinic desk</Link>
          <a href="#top">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
