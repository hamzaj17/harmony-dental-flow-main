import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, useRef } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  ArrowLeft,
  Clock3,
  ShieldCheck,
  Check,
  LogOut,
  Mail,
  RefreshCw,
  Settings2,
} from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import {
  type Appointment,
  type Settings,
  type Message,
  rpc,
  clinicDate,
  displayTime,
  shortTime,
  errorMessage,
  telHref,
} from "@/lib/appointments";
export const Route = createFileRoute("/owner")({
  component: Owner,
  head: () => ({
    meta: [
      { title: "Clinic desk | Multan Dental" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});
type Closure = { date: string; reason: string };
function Owner() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [user, setUser] = useState(""),
    [checking, setChecking] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [tab, setTab] = useState("appointments"),
    [rows, setRows] = useState<Appointment[]>([]),
    [messages, setMessages] = useState<Message[]>([]),
    [settings, setSettings] = useState<Settings | null>(null),
    [closures, setClosures] = useState<Closure[]>([]);
  const [date, setDate] = useState(""),
    [filter, setFilter] = useState("active"),
    [search, setSearch] = useState("");
  const [reschedule, setReschedule] = useState<Appointment | null>(null),
    [newDate, setNewDate] = useState(clinicDate()),
    [newTime, setNewTime] = useState(""),
    [slots, setSlots] = useState<string[]>([]),
    [slotLoading, setSlotLoading] = useState(false);
  useEffect(() => {
    if (reschedule) dialogRef.current?.showModal();
  }, [reschedule]);
  const refresh = useCallback(async () => {
    const [a, m, s, c] = await Promise.all([
      rpc<Appointment[]>("owner_appointments"),
      rpc<Message[]>("owner_messages"),
      rpc<Settings>("owner_settings"),
      rpc<Closure[]>("owner_closures"),
    ]);
    setRows(a);
    setMessages(m);
    setSettings((current) => current ?? s);
    setClosures(c);
  }, []);
  useEffect(() => {
    let active = true;
    rpc<{ username: string }>("session")
      .then(async (s) => {
        if (active) {
          setUser(s.username);
          await refresh();
        }
      })
      .catch((e) => {
        if (active && (e as { status?: number }).status !== 401) setError(errorMessage(e));
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [refresh]);
  useEffect(() => {
    if (!user) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh().catch((e) => setError(errorMessage(e)));
    }, 30000);
    return () => clearInterval(interval);
  }, [user, refresh]);
  useEffect(() => {
    if (!reschedule) return;
    let active = true;
    setSlots([]);
    setNewTime("");
    setSlotLoading(true);
    rpc<{ starts_at: string }[]>("available_slots", { p_date: newDate })
      .then((s) => {
        if (active) setSlots(s.map((v) => v.starts_at));
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      })
      .finally(() => {
        if (active) setSlotLoading(false);
      });
    return () => {
      active = false;
    };
  }, [newDate, reschedule]);
  async function run(fn: () => Promise<unknown>, message = "") {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
      if (message) setNotice(message);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await run(async () => {
      const s = await rpc<{ username: string }>("login", {
        username: f.get("username"),
        password: f.get("password"),
      });
      setUser(s.username);
      await refresh();
    });
  }
  async function update(a: Appointment, status: string) {
    await run(async () => {
      await rpc("owner_update_appointment", { p_id: a.id, p_status: status });
      await refresh();
    }, "Appointment updated.");
  }
  async function logout() {
    await run(async () => {
      await rpc("logout");
      setUser("");
      setRows([]);
      setMessages([]);
    });
  }
  const visible = rows
    .filter(
      (r) =>
        (!date || clinicDate(new Date(r.starts_at)) === date) &&
        (filter === "all" ||
          (filter === "active"
            ? ["pending", "confirmed"].includes(r.status)
            : r.status === filter)) &&
        `${r.name} ${r.phone} ${r.service}`.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const today = clinicDate();
  const upcoming = rows
    .filter(
      (a) => ["pending", "confirmed"].includes(a.status) && new Date(a.starts_at) > new Date(),
    )
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const next = upcoming[0];
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today + "T12:00:00+05:00");
    day.setUTCDate(day.getUTCDate() + i);
    const key = clinicDate(day);
    return {
      key,
      label: new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "Asia/Karachi" }).format(
        day,
      ),
      number: key.slice(-2),
      count: rows.filter(
        (a) =>
          clinicDate(new Date(a.starts_at)) === key && ["pending", "confirmed"].includes(a.status),
      ).length,
    };
  });
  return (
    <PageShell dashboard={Boolean(user)}>
      {user && (
        <aside className="admin-sidebar">
          <Link to="/" className="admin-brand">
            <span className="admin-monogram">
              m<sup>+</sup>
            </span>
            <span>
              multan dental<small>CLINIC DESK</small>
            </span>
          </Link>
          <p className="eyebrow sidebar-caption">WORKSPACE</p>
          <div className="desk-tabs" role="group" aria-label="Clinic sections">
            {[
              { id: "appointments", label: "Appointments", icon: CalendarDays },
              { id: "messages", label: "Messages", icon: Mail },
              { id: "settings", label: "Hours & account", icon: Settings2 },
            ].map((t) => (
              <button
                key={t.id}
                aria-pressed={tab === t.id}
                className={tab === t.id ? "active" : ""}
                onClick={() => {
                  setTab(t.id);
                  setNotice("");
                }}
              >
                <t.icon size={17} />
                {t.label}
              </button>
            ))}
            <button
              className="refresh-button"
              disabled={busy}
              aria-label="Refresh clinic desk"
              onClick={() => void run(refresh)}
            >
              <RefreshCw size={17} />
            </button>
          </div>

          <div className="sidebar-bottom">
            <div className="account-chip">
              <span>{user.slice(0, 1).toUpperCase()}</span>
              <div>
                {user}
                <small>Clinic administrator</small>
              </div>
            </div>
            <Link to="/" className="text-link">
              <ArrowLeft size={15} /> Back to website
            </Link>
            <p className="small muted">
              <ShieldCheck size={13} /> Private clinic workspace
            </p>
          </div>
        </aside>
      )}
      <section className="wrap desk section-bottom">
        <div className="desk-heading">
          <div>
            <p className="eyebrow">MULTAN DENTAL / CLINIC DESK</p>
            <h1>{user ? "Your day, in view." : "Welcome back."}</h1>
            <p className="muted">
              {user
                ? "A clear overview of your clinic. All times in Pakistan time."
                : "Sign in to manage your clinic."}
            </p>
          </div>
          {user && (
            <button className="btn btn-outline" disabled={busy} onClick={() => void logout()}>
              <LogOut size={16} /> Sign out
            </button>
          )}
        </div>
        {error && (
          <p className="error-note" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="success-note" role="status">
            <Check size={16} /> {notice}
          </p>
        )}
        {checking ? (
          <p className="panel">Checking your session…</p>
        ) : !user ? (
          <form onSubmit={login} className="panel login-panel form-stack">
            <p className="eyebrow">OWNER ACCESS</p>
            <label>
              Username
              <input name="username" autoComplete="username" required />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={128}
              />
            </label>
            <button className="btn" disabled={busy}>
              {busy ? "Signing in…" : "Open clinic desk"} <ArrowUpRight size={18} />
            </button>
            <p className="small muted">Your clinic administrator manages account access.</p>
          </form>
        ) : (
          <>
            <div className="desk-stats">
              <div>
                <span>Awaiting review</span>
                <strong>
                  {rows
                    .filter((a) => a.status === "pending")
                    .length.toString()
                    .padStart(2, "0")}
                </strong>
              </div>
              <div>
                <span>Today’s appointments</span>
                <strong>
                  {rows
                    .filter(
                      (a) =>
                        clinicDate(new Date(a.starts_at)) === clinicDate() &&
                        ["pending", "confirmed"].includes(a.status),
                    )
                    .length.toString()
                    .padStart(2, "0")}
                </strong>
              </div>
              <div>
                <span>Unread messages</span>
                <strong>
                  {messages
                    .filter((m) => !m.read)
                    .length.toString()
                    .padStart(2, "0")}
                </strong>
              </div>
            </div>
            {tab === "appointments" && (
              <div className="schedule-overview">
                <section className="week-panel" aria-label="Seven-day schedule">
                  <div className="overview-heading">
                    <div>
                      <p className="eyebrow">AT A GLANCE</p>
                      <h2>The next seven days</h2>
                    </div>
                    <CalendarDays size={20} />
                  </div>
                  <div className="week-days">
                    {week.map((d) => (
                      <button
                        key={d.key}
                        className={date === d.key ? "selected" : ""}
                        aria-pressed={date === d.key}
                        aria-label={d.key + ": " + d.count + " appointments"}
                        onClick={() => {
                          setDate(date === d.key ? "" : d.key);
                          setFilter("active");
                        }}
                      >
                        <span>{d.label}</span>
                        <strong>{d.number}</strong>
                        <span className={d.count ? "day-count has-visits" : "day-count"}>
                          {d.count ? d.count + (d.count === 1 ? " visit" : " visits") : "0 visits"}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
                <section className="next-visit" aria-label="Next appointment">
                  <p className="eyebrow">
                    <Clock3 size={14} /> UP NEXT
                  </p>
                  {next ? (
                    <>
                      <h2>{next.name}</h2>
                      <p>{next.service}</p>
                      <strong>{displayTime(next.starts_at)}</strong>
                      <span className={"status " + next.status}>{next.status}</span>
                      <a className="text-link" href={telHref(next.phone)}>
                        Call patient <ArrowUpRight size={15} />
                      </a>
                    </>
                  ) : (
                    <>
                      <h2>Ready for your next patient.</h2>
                      <p>Upcoming visits appear here as patients book.</p>
                      <Link className="text-link" to="/booking">
                        Open booking page <ArrowUpRight size={15} />
                      </Link>
                    </>
                  )}
                </section>
              </div>
            )}
            {tab === "appointments" && (
              <div role="region" aria-label="Appointments">
                <div className="desk-filters">
                  <label className="search-field">
                    Search
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Patient, phone, or treatment"
                    />
                  </label>
                  <label>
                    Status
                    <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                      {["active", "pending", "confirmed", "completed", "cancelled", "all"].map(
                        (s) => (
                          <option key={s}>{s}</option>
                        ),
                      )}
                    </select>
                  </label>
                  <label>
                    Date
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </label>
                  {date && (
                    <button className="text-link" onClick={() => setDate("")}>
                      Clear date
                    </button>
                  )}
                </div>
                <p className="small muted result-count">
                  {visible.length} appointments · Pakistan time · Refreshes every 30 seconds
                </p>
                <div className="appointment-list">
                  {!visible.length && (
                    <div className="empty-state">
                      <CalendarDays size={28} />
                      <h2>A little breathing room.</h2>
                      <p>No appointments match these filters.</p>
                    </div>
                  )}
                  {visible.map((a) => (
                    <article className="appointment-row" key={a.id}>
                      <div className="appointment-time">
                        <strong>{shortTime(a.starts_at)}</strong>
                        <span>{clinicDate(new Date(a.starts_at))}</span>
                      </div>
                      <div className="appointment-person">
                        <div className="person-heading">
                          <h3>{a.name}</h3>
                          <span className={`status ${a.status}`}>{a.status}</span>
                        </div>
                        <p>{a.service}</p>
                        <div className="contact-links">
                          <a href={telHref(a.phone)}>{a.phone}</a>
                          {a.email && <a href={`mailto:${a.email}`}>{a.email}</a>}
                        </div>
                        {a.message && <p className="patient-note">{a.message}</p>}
                      </div>
                      <div className="appointment-actions">
                        {["pending", "confirmed"].includes(a.status) && (
                          <>
                            {new Date(a.starts_at) > new Date() ? (
                              <>
                                {a.status === "pending" && (
                                  <button
                                    className="btn btn-small"
                                    disabled={busy}
                                    onClick={() => void update(a, "confirmed")}
                                  >
                                    Confirm
                                  </button>
                                )}
                                <button
                                  className="text-link"
                                  disabled={busy}
                                  onClick={() => {
                                    setReschedule(a);
                                    setNewDate(clinicDate());
                                  }}
                                >
                                  Reschedule
                                </button>
                              </>
                            ) : (
                              <button
                                className="btn btn-small"
                                disabled={busy}
                                onClick={() => void update(a, "completed")}
                              >
                                Complete visit
                              </button>
                            )}
                            <button
                              className="text-link danger"
                              disabled={busy}
                              onClick={() => {
                                if (window.confirm(`Cancel ${a.name}’s appointment?`))
                                  void update(a, "cancelled");
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
            {tab === "messages" && (
              <div role="region" aria-label="Messages" className="message-list">
                {!messages.length && (
                  <div className="empty-state">
                    <Mail size={28} />
                    <h2>All caught up.</h2>
                    <p>New enquiries will appear here.</p>
                  </div>
                )}
                {messages.map((m) => (
                  <article className="panel message-card" key={m.id}>
                    <div className="person-heading">
                      <h3>{m.name}</h3>
                      {!m.read && <span className="status pending">New</span>}
                      <span className="small muted">{displayTime(m.created_at)}</span>
                    </div>
                    <p className="patient-note">{m.message}</p>
                    <div className="button-row">
                      <a className="text-link" href={telHref(m.phone)}>
                        Call {m.phone}
                      </a>
                      {m.email && (
                        <a className="text-link" href={`mailto:${m.email}`}>
                          Reply by email <ArrowUpRight size={15} />
                        </a>
                      )}
                      {!m.read && (
                        <button
                          className="btn btn-small btn-outline"
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              setMessages(await rpc<Message[]>("owner_messages", { id: m.id }));
                            })
                          }
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
            {tab === "settings" && settings && (
              <div role="region" aria-label="Hours and account" className="settings-grid">
                <form
                  className="panel form-stack"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void run(async () => {
                      setSettings(
                        await rpc<Settings>("owner_settings", { ...settings, update: true }),
                      );
                    }, "Clinic hours saved. Existing appointments keep their original times.");
                  }}
                >
                  <p className="eyebrow">WEEKLY SCHEDULE</p>
                  <h2>When you’re here.</h2>
                  <div className="form-grid">
                    <label>
                      Opens
                      <select
                        value={settings.opening}
                        onChange={(e) =>
                          setSettings({ ...settings, opening: Number(e.target.value) })
                        }
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {String(i).padStart(2, "0")}:00
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Closes
                      <select
                        value={settings.closing}
                        onChange={(e) =>
                          setSettings({ ...settings, closing: Number(e.target.value) })
                        }
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {String(i + 1).padStart(2, "0")}:00
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <fieldset>
                    <legend>Working days</legend>
                    <div className="day-checks">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                        <label key={d}>
                          <input
                            type="checkbox"
                            checked={settings.days.includes(i)}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                days: e.target.checked
                                  ? [...settings.days, i]
                                  : settings.days.filter((v) => v !== i),
                              })
                            }
                          />
                          {d}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <p className="small muted">
                    30-minute appointments, up to 90 days ahead. Existing appointments are preserved
                    when hours change.
                  </p>
                  <button className="btn" disabled={busy}>
                    Save clinic hours
                  </button>
                </form>
                <div className="panel form-stack">
                  <p className="eyebrow">TIME AWAY</p>
                  <h2>Close a date.</h2>
                  <form
                    className="form-stack"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      void run(async () => {
                        setClosures(
                          await rpc<Closure[]>("owner_closures", {
                            date: f.get("date"),
                            reason: f.get("reason"),
                          }),
                        );
                      }, "Closed date saved.");
                    }}
                  >
                    <label>
                      Date
                      <input name="date" type="date" required min={clinicDate()} />
                    </label>
                    <label>
                      Reason
                      <input
                        name="reason"
                        required
                        maxLength={200}
                        placeholder="Holiday, training, or a day off"
                      />
                    </label>
                    <button className="btn btn-outline" disabled={busy}>
                      Close this date
                    </button>
                  </form>
                  <ul className="closure-list">
                    {closures.map((c) => (
                      <li key={c.date}>
                        <span>
                          <strong>{c.date}</strong>
                          <br />
                          {c.reason}
                        </span>
                        <button
                          className="text-link"
                          disabled={busy}
                          onClick={() =>
                            void run(async () =>
                              setClosures(
                                await rpc<Closure[]>("owner_closures", {
                                  date: c.date,
                                  remove: true,
                                }),
                              ),
                            )
                          }
                        >
                          Reopen
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <form
                  className="panel form-stack"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    void run(async () => {
                      if (f.get("password") !== f.get("confirm"))
                        throw new Error("New passwords do not match.");
                      await rpc("owner_password", {
                        current: f.get("current"),
                        password: f.get("password"),
                      });
                      setUser("");
                      setRows([]);
                      setMessages([]);
                    }, "Password changed. Please sign in again.");
                  }}
                >
                  <p className="eyebrow">ACCOUNT SECURITY</p>
                  <h2>Change your password.</h2>
                  <label>
                    Current password
                    <input
                      name="current"
                      type="password"
                      required
                      autoComplete="current-password"
                    />
                  </label>
                  <label>
                    New password
                    <input
                      name="password"
                      type="password"
                      required
                      minLength={12}
                      maxLength={128}
                      autoComplete="new-password"
                    />
                  </label>
                  <label>
                    Confirm new password
                    <input
                      name="confirm"
                      type="password"
                      required
                      minLength={12}
                      maxLength={128}
                      autoComplete="new-password"
                    />
                  </label>
                  <button className="btn" disabled={busy}>
                    Update password
                  </button>
                </form>
              </div>
            )}
            {reschedule && (
              <dialog
                ref={dialogRef}
                className="reschedule-modal"
                aria-labelledby="reschedule-title"
                onCancel={() => setReschedule(null)}
              >
                <section className="panel reschedule-dialog">
                  <h2 id="reschedule-title">Reschedule {reschedule.name}</h2>
                  <p className="muted">Currently {displayTime(reschedule.starts_at)}</p>
                  <label>
                    New date
                    <input
                      type="date"
                      autoFocus
                      value={newDate}
                      min={clinicDate()}
                      onChange={(e) => setNewDate(e.target.value)}
                    />
                  </label>
                  <label htmlFor="reschedule-time">
                    Available time
                    <select
                      id="reschedule-time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      disabled={slotLoading}
                    >
                      <option value="">{slotLoading ? "Loading…" : "Choose a time"}</option>
                      {slots.map((s) => (
                        <option key={s} value={s}>
                          {shortTime(s)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {error && (
                    <p role="alert" className="error-note">
                      {error}
                    </p>
                  )}
                  <div className="button-row">
                    <button
                      className="btn"
                      disabled={!newTime || busy}
                      onClick={() =>
                        void run(async () => {
                          await rpc("owner_update_appointment", {
                            p_id: reschedule.id,
                            p_starts_at: newTime,
                          });
                          setReschedule(null);
                          await refresh();
                        }, "Appointment rescheduled. Contact the patient to let them know.")
                      }
                    >
                      Save new time
                    </button>
                    <button className="text-link" onClick={() => setReschedule(null)}>
                      Close
                    </button>
                  </div>
                </section>
              </dialog>
            )}
          </>
        )}
      </section>
    </PageShell>
  );
}
