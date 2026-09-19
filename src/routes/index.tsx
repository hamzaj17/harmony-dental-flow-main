import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { ClinicHours } from "@/components/site/Footer";
import { Reveal } from "@/components/site/Reveal";
import { DentalScene } from "@/components/site/DentalScene";
import { errorMessage, rpc, services } from "@/lib/appointments";
import interior from "@/assets/clinic-interior.jpg";
import instruments from "@/assets/instruments-editorial.jpg";

export const Route = createFileRoute("/")({ component: Home });

const serviceNotes = [
  "Routine examinations, professional cleaning, and a clear plan for ongoing oral health.",
  "Professional whitening options discussed around your teeth and your goals.",
  "An alignment assessment with braces and clear-aligner options to consider.",
  "Planning for missing teeth, with each stage explained before treatment begins.",
  "A personal consultation about shape, shade, restorations, and your smile goals.",
  "A direct route to the clinic when pain or a damaged tooth needs attention.",
  "Assessment and treatment planning for teeth that may need root canal care.",
  "Options for replacement teeth, restorations, fit, and ongoing care.",
];

const proof = [
  {
    icon: Stethoscope,
    title: "A named clinician",
    copy: "Your care is with Dr. Alizay Gull Khan. The same name appears throughout your booking journey.",
  },
  {
    icon: MapPin,
    title: "A clinic you can find",
    copy: "Main Road, Shalimar Colony, Multan. The map reference and direct route are published below.",
  },
  {
    icon: CalendarCheck,
    title: "A booking you can track",
    copy: "Every request gets a private reference so you can check its status or cancel online.",
  },
  {
    icon: LockKeyhole,
    title: "A private clinic desk",
    copy: "Your request goes to the clinic’s protected dashboard for review and confirmation.",
  },
];

function Home() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function sendEnquiry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await rpc("contact", Object.fromEntries(new FormData(event.currentTarget)));
      setSent(true);
      event.currentTarget.reset();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell>
      <section className="wrap home-hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="live-dot" /> DENTAL & AESTHETIC CARE · MULTAN
          </p>
          <h1>
            Thoughtful care.
            <br />
            Beautifully
            <br />
            <em>personal.</em>
          </h1>
          <p className="hero-description">
            Calm, considered dentistry with Dr. Alizay Gull Khan—where questions are welcome and
            every next step is explained.
          </p>
          <div className="hero-actions">
            <Link to="/booking" className="btn">
              Book your visit <ArrowUpRight size={19} />
            </Link>
            <a href="#proof" className="text-link">
              Why patients can trust us <ArrowRight size={17} />
            </a>
          </div>
          <div className="hero-assurance">
            <span>
              <CheckCircle2 size={15} /> Private booking reference
            </span>
            <span>
              <CheckCircle2 size={15} /> No online payment required
            </span>
          </div>
        </div>
        <DentalScene />
      </section>

      <section className="clinic-strip" aria-label="Clinic facts">
        <div className="wrap">
          <p>
            <span>YOUR DENTIST</span>Dr. Alizay Gull Khan
          </p>
          <p>
            <span>CLINIC HOURS</span>
            <ClinicHours />
          </p>
          <a href="tel:+923117594193">
            <span>DIRECT CLINIC LINE</span>0311 7594193 <ArrowUpRight size={16} />
          </a>
        </div>
      </section>

      <Reveal>
        <section className="wrap trust-section" id="proof">
          <div className="trust-intro">
            <p className="eyebrow">01 / TRUST, MADE VISIBLE</p>
            <h2>
              Know who you’re booking.
              <br />
              <em>Know what happens next.</em>
            </h2>
            <p>
              Trust comes from details you can check. We publish the clinician, location, contact
              route, booking process, and privacy approach before you visit.
            </p>
          </div>
          <div className="proof-grid">
            {proof.map((item, index) => (
              <article className="proof-card" key={item.title}>
                <span className="proof-icon">
                  <item.icon size={20} />
                </span>
                <span className="proof-number">0{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
          <p className="proof-note">
            <ShieldCheck size={17} /> We don’t publish invented reviews, awards, or before-and-after
            claims. Ask the clinic directly about qualifications, fees, and the treatment that is
            right for you.
          </p>
        </section>
      </Reveal>

      <section className="services-section" id="care">
        <div className="wrap">
          <div className="section-heading services-heading">
            <p className="eyebrow">02 / CARE, CLEARLY EXPLAINED</p>
            <h2>
              Everything starts
              <br />
              with <em>understanding.</em>
            </h2>
            <p>
              Choose what brings you in. Your dentist will assess your needs and explain timing,
              options, and costs before treatment.
            </p>
          </div>
          <div className="services-bento">
            {services.map((service, index) => (
              <article className="service-card" key={service}>
                <span className="service-index">{String(index + 1).padStart(2, "0")}</span>
                <h3>{service}</h3>
                <p>{serviceNotes[index]}</p>
                <Link
                  to="/booking"
                  className="service-link"
                  aria-label={`Book a consultation for ${service}`}
                >
                  <ArrowUpRight size={18} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Reveal>
        <section className="wrap doctor-section" id="clinic">
          <div className="doctor-image-wrap">
            <img
              src={interior}
              alt="A bright dental treatment room"
              width={1600}
              height={1100}
              loading="lazy"
              decoding="async"
            />
            <div className="doctor-image-badge">
              <span>SHALIMAR COLONY</span>
              <strong>Multan, Pakistan</strong>
            </div>
          </div>
          <div className="doctor-copy">
            <p className="eyebrow">03 / YOUR CLINIC</p>
            <h2>
              A space to ask.
              <br />A dentist who <em>listens.</em>
            </h2>
            <p className="doctor-lead">
              Dental care can feel uncertain. Dr. Alizay Gull Khan’s approach begins with a
              conversation: what is bothering you, what you hope to change, and what feels
              manageable.
            </p>
            <div className="doctor-principles">
              <div>
                <span>01</span>
                <h3>Start with your concern</h3>
                <p>Tell us what brought you in. We’ll begin there.</p>
              </div>
              <div>
                <span>02</span>
                <h3>See the options clearly</h3>
                <p>Ask about the plan, timing, and fee before deciding.</p>
              </div>
              <div>
                <span>03</span>
                <h3>Move at your pace</h3>
                <p>Choose the next step once you understand it.</p>
              </div>
            </div>
            <Link to="/booking" className="btn">
              Arrange a first visit <ArrowUpRight size={18} />
            </Link>
          </div>
        </section>
      </Reveal>

      <section className="visit-flow" id="process">
        <div className="wrap visit-flow-grid">
          <div>
            <p className="eyebrow">04 / FROM SCREEN TO CHAIR</p>
            <h2>
              Your visit,
              <br />
              <em>without the guesswork.</em>
            </h2>
            <img
              src={instruments}
              alt="Dental examination instruments prepared on clean linen"
              width={1536}
              height={1024}
              loading="lazy"
            />
          </div>
          <ol className="process-list">
            <li>
              <span>01</span>
              <div>
                <h3>Pick a real available time</h3>
                <p>The booking calendar reads the clinic diary and only shows open appointments.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Send your request privately</h3>
                <p>
                  Your details go directly to the owner dashboard. You receive a private reference
                  immediately.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>The clinic reviews it</h3>
                <p>
                  The owner can confirm or reschedule the request from the protected clinic desk.
                </p>
              </div>
            </li>
            <li>
              <span>04</span>
              <div>
                <h3>Stay in control</h3>
                <p>
                  Use your reference to check the status or cancel online. Call any time you need a
                  person.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="wrap contact-section" id="contact">
        <div className="contact-trust-panel">
          <p className="eyebrow">05 / COME SAY HELLO</p>
          <h2>
            Right here
            <br />
            in <em>Multan.</em>
          </h2>
          <div className="contact-proof-row">
            <MapPin size={18} />
            <div>
              <span>VISIT</span>
              <strong>
                Main Road, Shalimar Colony
                <br />
                Multan, Pakistan
              </strong>
            </div>
          </div>
          <div className="contact-proof-row">
            <Phone size={18} />
            <div>
              <span>CALL</span>
              <a href="tel:+923117594193">0311 7594193</a>
            </div>
          </div>
          <div className="contact-proof-row">
            <Clock3 size={18} />
            <div>
              <span>HOURS</span>
              <strong>
                <ClinicHours />
              </strong>
            </div>
          </div>
          <div className="contact-links-row">
            <a
              className="text-link"
              target="_blank"
              rel="noreferrer"
              href="https://www.google.com/maps/search/?api=1&query=6FQM%2BVQR%20Shalimar%20Colony%20Multan"
            >
              Open directions <ArrowUpRight size={16} />
            </a>
            <a
              className="text-link"
              target="_blank"
              rel="noreferrer"
              href="https://wa.me/923117594193"
            >
              WhatsApp <ArrowUpRight size={16} />
            </a>
          </div>
          <p className="map-reference">
            <MapPin size={13} /> Map reference: 6FQM+VQR
          </p>
        </div>
        <div className="enquiry-wrap">
          {sent ? (
            <div className="enquiry-success" role="status">
              <span>
                <Check />
              </span>
              <p className="eyebrow">MESSAGE RECEIVED</p>
              <h2>Your message is with us.</h2>
              <p>The clinic will use the details you provided to get back to you.</p>
              <button className="text-link" onClick={() => setSent(false)}>
                Send another message
              </button>
            </div>
          ) : (
            <form className="form-stack" onSubmit={sendEnquiry}>
              <div>
                <p className="eyebrow">SEND A PRIVATE ENQUIRY</p>
                <h2>What’s on your mind?</h2>
              </div>
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
                How can we help?
                <textarea
                  name="message"
                  required
                  rows={4}
                  minLength={10}
                  maxLength={2000}
                  placeholder="Tell us about your concern."
                />
              </label>
              <label className="sr-only" aria-hidden="true">
                Leave this blank
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
              <p className="small muted">
                <LockKeyhole size={13} /> Sent privately to the clinic desk. Please call for urgent
                concerns.
              </p>
              {error && (
                <p className="error-note" role="alert">
                  {error}
                </p>
              )}
              <button className="btn" disabled={busy}>
                {busy ? "Sending…" : "Send enquiry"}
                <ArrowUpRight size={18} />
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="wrap first-visit" id="questions">
        <div className="section-heading">
          <p className="eyebrow">06 / GOOD TO KNOW</p>
          <h2>
            Before you
            <br />
            <em>come in.</em>
          </h2>
        </div>
        <div className="faq-list">
          {[
            {
              q: "How does online booking work?",
              a: "Choose an available time and add your contact details. Your request is saved immediately for clinic review. Keep the private reference shown after booking to check your status.",
            },
            {
              q: "Is an online booking automatically confirmed?",
              a: "No. The appointment begins as a request. The clinic reviews it and updates the status to confirmed. You can check that status with your private reference.",
            },
            {
              q: "Can I change or cancel my appointment?",
              a: "You can cancel a future visit online with your private reference. For rescheduling, call the clinic or choose another available time.",
            },
            {
              q: "How are treatment fees handled?",
              a: "The clinic discusses treatment choices, timing, and fees after understanding your needs. No online payment is collected when you request an appointment.",
            },
            {
              q: "Where is the clinic?",
              a: "Main Road in Shalimar Colony, Multan. Use map reference 6FQM+VQR or call 0311 7594193 if you need directions.",
            },
          ].map((item) => (
            <details key={item.q}>
              <summary>
                {item.q}
                <Plus size={19} />
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
