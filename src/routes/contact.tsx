import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { ClinicHours } from "@/components/site/Footer";
import { rpc, errorMessage } from "@/lib/appointments";
export const Route = createFileRoute("/contact")({
  component: Contact,
  head: () => ({ meta: [{ title: "Find us | Multan Dental & Aesthetics" }] }),
});
function Contact() {
  const [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      await rpc("contact", Object.fromEntries(f));
      setSent(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <PageShell>
      <PageHero
        eyebrow="COME SAY HELLO"
        title="We’re just around the corner."
        subtitle="Find us in Shalimar Colony, Multan. Call, send a message, or book your next visit online."
      />
      <section className="wrap contact-layout section-bottom">
        {sent ? (
          <div className="panel receipt" role="status">
            <span className="success-mark">
              <Check />
            </span>
            <h2>Your message is with us.</h2>
            <p>
              The clinic has received your enquiry. We’ll use the contact details you provided to
              get back to you.
            </p>
            <button className="text-link" onClick={() => setSent(false)}>
              Send another message
            </button>
          </div>
        ) : (
          <form className="panel form-stack" onSubmit={submit}>
            <p className="eyebrow">SEND AN ENQUIRY</p>
            <h2>What’s on your mind?</h2>
            <label>
              Full name
              <input
                required
                name="name"
                minLength={2}
                maxLength={100}
                autoComplete="name"
                placeholder="Your full name"
              />
            </label>
            <div className="form-grid">
              <label>
                Phone number
                <input
                  required
                  name="phone"
                  type="tel"
                  minLength={10}
                  maxLength={24}
                  autoComplete="tel"
                  placeholder="03xx xxxxxxx"
                />
              </label>
              <label>
                Email (optional)
                <input
                  name="email"
                  type="email"
                  maxLength={254}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </label>
            </div>
            <label>
              Message
              <textarea
                name="message"
                required
                rows={5}
                minLength={10}
                maxLength={2000}
                placeholder="Tell us how we can help."
              />
            </label>
            <label className="sr-only" aria-hidden="true">
              Leave this blank
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
            <p className="small muted">
              Your message is sent privately to the clinic desk. Please call for urgent enquiries.
            </p>
            {error && (
              <p className="error-note" role="alert">
                {error}
              </p>
            )}
            <button className="btn" disabled={busy}>
              {busy ? "Sending…" : "Send your message"}
              <ArrowUpRight size={18} />
            </button>
          </form>
        )}
        <aside className="contact-info">
          <p className="eyebrow">MULTAN DENTAL & AESTHETICS</p>
          <h2>
            Let’s find a time
            <br />
            <em>that works.</em>
          </h2>
          <div className="contact-detail">
            <p className="eyebrow">CALL THE CLINIC</p>
            <a href="tel:+923117594193">0311 7594193</a>
            <a
              className="text-link"
              href="https://wa.me/923117594193"
              target="_blank"
              rel="noreferrer"
            >
              Or chat on WhatsApp <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="contact-detail">
            <p className="eyebrow">CLINIC HOURS</p>
            <p>
              <ClinicHours />
            </p>
            <p className="small">
              Availability can vary on holidays. Check the booking diary before visiting.
            </p>
          </div>
          <div className="contact-map">
            <p className="eyebrow">FIND US</p>
            <h2>
              Main Road.
              <br />
              Shalimar Colony.
            </h2>
            <p>
              Multan, Pakistan
              <br />
              Map reference: 6FQM+VQR
            </p>
            <a
              className="text-link"
              href="https://www.google.com/maps/search/?api=1&query=6FQM%2BVQR%20Shalimar%20Colony%20Multan"
              target="_blank"
              rel="noreferrer"
            >
              Open directions <ArrowUpRight size={17} />
            </a>
          </div>
        </aside>
      </section>
    </PageShell>
  );
}
