import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, ChevronLeft, Clock, Download, Phone } from "lucide-react";
import { PageShell, PageHero } from "@/components/site/PageShell";
import {
  type Appointment,
  services,
  clinicDate,
  displayTime,
  shortTime,
  rpc,
  errorMessage,
} from "@/lib/appointments";
export const Route = createFileRoute("/booking")({
  component: Booking,
  head: () => ({
    meta: [
      { title: "Book a visit | Multan Dental & Aesthetics" },
      {
        name: "description",
        content:
          "Choose an available appointment at Multan Dental in Shalimar Colony. Check or change your booking with a private reference.",
      },
    ],
  }),
});
function Booking() {
  const [step, setStep] = useState(1),
    [service, setService] = useState(services[0]),
    [date, setDate] = useState(clinicDate()),
    [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [refresh, setRefresh] = useState(0);
  const [receipt, setReceipt] = useState<Appointment | null>(null),
    [lookup, setLookup] = useState(""),
    [managed, setManaged] = useState<Appointment | null>(null),
    [manageError, setManageError] = useState(""),
    [manageBusy, setManageBusy] = useState(false);
  const ref = useRef("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setTime("");
    setSlots([]);
    setError("");
    rpc<{ starts_at: string }[]>("available_slots", { p_date: date })
      .then((data) => {
        if (active) setSlots(data.map((s) => s.starts_at));
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [date, refresh]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    ref.current ||= crypto.randomUUID();
    try {
      const a = await rpc<Appointment>("book_appointment", {
        p_reference: ref.current,
        p_name: form.get("name"),
        p_phone: form.get("phone"),
        p_email: form.get("email"),
        p_service: service,
        p_starts_at: time,
        p_message: form.get("message"),
      });
      setReceipt(a);
      setLookup(ref.current);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function manage(cancel = false) {
    setManageBusy(true);
    setManageError("");
    try {
      setManaged(
        await rpc<Appointment>("manage_appointment", {
          p_reference: lookup.trim(),
          p_cancel: cancel,
        }),
      );
      if (cancel) setRefresh((x) => x + 1);
    } catch (e) {
      setManageError(errorMessage(e));
    } finally {
      setManageBusy(false);
    }
  }
  function download() {
    if (!receipt) return;
    const content = `MULTAN DENTAL & AESTHETICS\nAppointment request\n\n${receipt.name}\n${receipt.service}\n${displayTime(receipt.starts_at)} (Pakistan)\nStatus: ${receipt.status}\n\nPrivate reference: ${ref.current}\nCheck status: ${location.origin}/booking#manage\n\nKeep this reference private. The clinic will confirm your visit.\n0311 7594193\n`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "multan-dental-booking.txt";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <PageShell>
      <PageHero
        eyebrow="YOUR NEXT VISIT"
        title="Let’s make time for you."
        subtitle="Choose a service and an available time. We’ll review your request and contact you to confirm."
      />
      <section className="wrap booking-layout section-bottom">
        <div>
          {receipt ? (
            <div className="panel receipt" role="status">
              <span className="success-mark">
                <Check size={28} />
              </span>
              <p className="eyebrow">REQUEST RECEIVED</p>
              <h2>You’re on our list.</h2>
              <p>
                {receipt.name}, we’ve saved your request for{" "}
                <strong>{displayTime(receipt.starts_at)}</strong>.
              </p>
              <div className="receipt-detail">
                <span>{receipt.service}</span>
                <span className="status pending">Pending confirmation</span>
              </div>
              <p>
                Save your private reference. You’ll need it to check your status or cancel a visit.
              </p>
              <code className="reference">{ref.current}</code>
              <p className="small muted">
                Anyone with this reference can access this booking. Keep it private.
              </p>
              <div className="button-row">
                <button className="btn" onClick={download}>
                  <Download size={16} /> Save booking details
                </button>
                <button
                  className="text-link"
                  onClick={() => {
                    setReceipt(null);
                    ref.current = "";
                    setStep(1);
                    setRefresh((x) => x + 1);
                  }}
                >
                  Book another visit <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="panel booking-panel">
              <div className="step-header">
                <span className={step === 1 ? "active" : ""}>
                  01 <span>Your visit</span>
                </span>
                <span className={step === 2 ? "active" : ""}>
                  02 <span>Your details</span>
                </span>
              </div>
              {step === 1 ? (
                <div className="form-stack">
                  <div>
                    <p className="eyebrow">LET’S START HERE</p>
                    <h2>What brings you in?</h2>
                  </div>
                  <label>
                    Choose a service
                    <select value={service} onChange={(e) => setService(e.target.value)}>
                      {services.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Your preferred date
                    <input
                      type="date"
                      required
                      value={date}
                      min={clinicDate()}
                      max={clinicDate(new Date(Date.now() + 90 * 86400000))}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </label>
                  <fieldset>
                    <legend>
                      Available times <span className="muted small">· Pakistan time</span>
                    </legend>
                    <div className="slot-grid" aria-busy={loading}>
                      {loading ? (
                        <p className="muted">Checking the diary…</p>
                      ) : slots.length ? (
                        slots.map((s) => (
                          <button
                            type="button"
                            key={s}
                            className={`slot ${time === s ? "selected" : ""}`}
                            aria-pressed={time === s}
                            onClick={() => setTime(s)}
                          >
                            {shortTime(s)}
                          </button>
                        ))
                      ) : (
                        <p className="empty-inline">
                          No appointments available on this date. Try another day or call us.
                        </p>
                      )}
                    </div>
                  </fieldset>
                  <button
                    className="btn"
                    disabled={!time || loading}
                    onClick={() => {
                      setStep(2);
                      setError("");
                    }}
                  >
                    Continue to your details <ArrowRight size={17} />
                  </button>
                </div>
              ) : (
                <form className="form-stack" onSubmit={submit}>
                  <button
                    className="text-link back-link"
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError("");
                    }}
                  >
                    <ChevronLeft size={16} /> Change your visit
                  </button>
                  <h2>A little about you.</h2>
                  <div className="selection-summary">
                    <span>{service}</span>
                    <strong>{displayTime(time)}</strong>
                  </div>
                  <div className="form-grid">
                    <label>
                      Full name
                      <input
                        name="name"
                        autoComplete="name"
                        required
                        minLength={2}
                        maxLength={100}
                        placeholder="Your full name"
                      />
                    </label>
                    <label>
                      Phone number
                      <input
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        required
                        minLength={10}
                        maxLength={24}
                        placeholder="03xx xxxxxxx"
                      />
                    </label>
                  </div>
                  <label>
                    Email <span className="muted">(optional)</span>
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      maxLength={254}
                      placeholder="you@example.com"
                    />
                  </label>
                  <label>
                    Anything we should know? <span className="muted">(optional)</span>
                    <textarea
                      name="message"
                      rows={3}
                      maxLength={1000}
                      placeholder="For example, a first visit or a concern you’d like to discuss."
                    />
                  </label>
                  <label className="check-label">
                    <input type="checkbox" required />{" "}
                    <span>
                      I agree to share these details with the clinic to arrange my visit.{" "}
                      <Link to="/privacy">Privacy information</Link>
                    </span>
                  </label>
                  <button className="btn" disabled={busy}>
                    {busy ? "Saving your request…" : "Request appointment"} <ArrowRight size={17} />
                  </button>
                </form>
              )}
              {error && (
                <div className="error-note" role="alert">
                  {error}{" "}
                  <button
                    className="text-link"
                    onClick={() => {
                      setStep(1);
                      setRefresh((x) => x + 1);
                    }}
                  >
                    Refresh available times
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="panel manage-panel" id="manage">
            <p className="eyebrow">ALREADY BOOKED?</p>
            <h2>Keep track of your visit.</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void manage();
              }}
              className="form-stack"
            >
              <label>
                Private booking reference
                <input
                  required
                  value={lookup}
                  onChange={(e) => {
                    setLookup(e.target.value);
                    setManaged(null);
                  }}
                  placeholder="Paste the reference from your booking"
                />
              </label>
              <button className="btn btn-outline" disabled={manageBusy}>
                {manageBusy ? "Checking…" : "Check appointment"}
              </button>
            </form>
            {manageError && (
              <p className="error-note" role="alert">
                {manageError}
              </p>
            )}
            {managed && (
              <div className="managed-result" aria-live="polite">
                <span className={`status ${managed.status}`}>{managed.status}</span>
                <h3>{managed.service}</h3>
                <p>{displayTime(managed.starts_at)}</p>
                {["pending", "confirmed"].includes(managed.status) &&
                  new Date(managed.starts_at) > new Date() && (
                    <button
                      className="text-link danger"
                      disabled={manageBusy}
                      onClick={() => {
                        if (
                          window.confirm(
                            "Cancel this appointment? The time will be made available to others.",
                          )
                        )
                          void manage(true);
                      }}
                    >
                      Cancel this appointment
                    </button>
                  )}
                <p className="small muted">
                  Need a different time? Call the clinic or cancel and book another available slot.
                </p>
              </div>
            )}
          </div>
        </div>
        <aside className="booking-aside">
          <span className="eyebrow">A FEW THINGS TO KNOW</span>
          <h2>A visit, at your pace.</h2>
          <div className="aside-item">
            <span>01</span>
            <p>Pick a time that works for you. All appointments use Pakistan time.</p>
          </div>
          <div className="aside-item">
            <span>02</span>
            <p>Your request goes straight to the clinic desk for confirmation.</p>
          </div>
          <div className="aside-item">
            <span>03</span>
            <p>Save your booking reference to check your status any time.</p>
          </div>
          <div className="aside-contact">
            <Phone size={20} />
            <p>Prefer a conversation?</p>
            <a href="tel:+923117594193">0311 7594193</a>
            <p className="small">For an urgent appointment, please call.</p>
          </div>
          <div className="small muted flex items-center gap-2">
            <Clock size={16} /> Allow a little extra time for your first visit.
          </div>
        </aside>
      </section>
    </PageShell>
  );
}
