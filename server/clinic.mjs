import { DatabaseSync } from "node:sqlite";
import {
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const scrypt = promisify(scryptCallback);
const hash = (value) => createHash("sha256").update(value).digest("hex");
export const SERVICES = [
  "Checkup & Cleaning",
  "Teeth Whitening",
  "Braces / Invisalign",
  "Dental Implants",
  "Cosmetic Dentistry",
  "Emergency Care",
  "Root Canal Treatment",
  "Dentures & Crowns",
];
const timezone = "Asia/Karachi";
const dateInClinic = (value = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
const error = (message, status = 400) => Object.assign(new Error(message), { status });
const text = (value, min, max, label) => {
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max)
    throw error(`Please enter a valid ${label}.`);
  return value.trim();
};
const phone = (value) => {
  const p = text(value, 10, 24, "phone number").replace(/[ ()-]/g, "");
  if (!/^\+?\d{10,15}$/.test(p)) throw error("Please enter a valid phone number.");
  return p;
};
const reference = (value) => {
  if (typeof value !== "string" || !/^[a-f0-9-]{36}$/i.test(value))
    throw error("Please check your private booking reference.");
  return hash(value);
};
const email = (value) => {
  const e = text(value || "", 0, 254, "email");
  if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw error("Please enter a valid email.");
  return e;
};
export async function passwordHash(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${Buffer.from(await scrypt(password, salt, 64)).toString("hex")}`;
}
async function passwordMatches(password, saved) {
  const [salt, digest] = saved.split(":");
  const result = await scrypt(password, salt, 64);
  return timingSafeEqual(Buffer.from(digest, "hex"), result);
}

export function createClinic(filename = process.env.DATABASE_PATH || ".data/clinic.sqlite") {
  if (filename !== ":memory:") mkdirSync(dirname(resolve(filename)), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS owners(id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES owners(id), expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS settings(id INTEGER PRIMARY KEY CHECK(id=1), opening INTEGER NOT NULL, closing INTEGER NOT NULL, days TEXT NOT NULL);
    INSERT OR IGNORE INTO settings VALUES(1,16,22,'[0,1,2,3,4,5,6]');
    CREATE TABLE IF NOT EXISTS closures(date TEXT PRIMARY KEY, reason TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS appointments(id TEXT PRIMARY KEY, reference_hash TEXT NOT NULL UNIQUE, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL, service TEXT NOT NULL, starts_at TEXT NOT NULL, message TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('pending','confirmed','cancelled','completed')), created_at TEXT NOT NULL);
    CREATE UNIQUE INDEX IF NOT EXISTS active_slot ON appointments(starts_at) WHERE status <> 'cancelled';
    CREATE INDEX IF NOT EXISTS appointment_date ON appointments(starts_at);
    CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY,name TEXT NOT NULL,phone TEXT NOT NULL,email TEXT NOT NULL,message TEXT NOT NULL,read INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,reset INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,appointment_id TEXT NOT NULL,action TEXT NOT NULL,actor TEXT NOT NULL,created_at TEXT NOT NULL);
    PRAGMA user_version=1;`);
  const stmt = (sql) => db.prepare(sql);
  const receipt = (row) => {
    if (!row) throw error("Booking not found. Check your private reference.", 404);
    const { reference_hash, ...safe } = row;
    return safe;
  };
  function transaction(fn) {
    db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      db.exec("COMMIT");
      return result;
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
  function settings() {
    const r = stmt("SELECT * FROM settings WHERE id=1").get();
    return {
      opening: r.opening,
      closing: r.closing,
      days: JSON.parse(r.days),
      timezone,
      services: SERVICES,
    };
  }
  function slots(date) {
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date))
      throw error("Choose a valid date.");
    const day = new Date(`${date}T12:00:00+05:00`);
    if (!Number.isFinite(day.getTime()) || dateInClinic(day) !== date)
      throw error("Choose a valid date.");
    const s = settings();
    if (
      date < dateInClinic() ||
      date > dateInClinic(new Date(Date.now() + 90 * 86400000)) ||
      !s.days.includes(day.getUTCDay()) ||
      stmt("SELECT 1 FROM closures WHERE date=?").get(date)
    )
      return [];
    const occupied = new Set(
      stmt(
        "SELECT starts_at FROM appointments WHERE status<>'cancelled' AND starts_at>=? AND starts_at<?",
      )
        .all(
          new Date(`${date}T00:00:00+05:00`).toISOString(),
          new Date(`${date}T23:59:59+05:00`).toISOString(),
        )
        .map((r) => r.starts_at),
    );
    return Array.from({ length: (s.closing - s.opening) * 2 }, (_, i) =>
      new Date(
        `${date}T${String(s.opening + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}:00+05:00`,
      ).toISOString(),
    )
      .filter((s) => new Date(s).getTime() > Date.now() && !occupied.has(s))
      .map((starts_at) => ({ starts_at }));
  }
  function validSlot(value) {
    const d = new Date(value);
    if (!Number.isFinite(d.getTime())) throw error("Choose an available time.");
    const iso = d.toISOString();
    if (!slots(dateInClinic(d)).some((s) => s.starts_at === iso))
      throw error("That time is no longer available. Please choose another.", 409);
    return iso;
  }
  function log(id, action, actor) {
    stmt("INSERT INTO audit(appointment_id,action,actor,created_at) VALUES(?,?,?,?)").run(
      id,
      action,
      actor,
      new Date().toISOString(),
    );
  }
  function rate(key, max = 12, window = 900000) {
    const now = Date.now();
    stmt("DELETE FROM rate_limits WHERE reset<?").run(now);
    const r = stmt("SELECT * FROM rate_limits WHERE key=?").get(hash(key));
    if (r && r.count >= max)
      throw error("Too many attempts. Please try again in 15 minutes or call the clinic.", 429);
    stmt("INSERT INTO rate_limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1").run(
      hash(key),
      now + window,
    );
  }
  async function createOwner(username, password) {
    text(password, 12, 128, "password (12–128 characters)");
    stmt("INSERT INTO owners VALUES(?,?,?)").run(
      randomUUID(),
      text(username, 3, 100, "username").toLowerCase(),
      await passwordHash(password),
    );
  }
  function owner(request) {
    const cookie = request.headers
      .get("cookie")
      ?.split(";")
      .map((v) => v.trim())
      .find((v) => v.startsWith("clinic_session="))
      ?.slice(15);
    if (!cookie) throw error("Please sign in to access the clinic desk.", 401);
    const session = stmt(
      "SELECT o.id,o.username FROM sessions s JOIN owners o ON o.id=s.owner_id WHERE token_hash=? AND expires>?",
    ).get(hash(cookie), Date.now());
    if (!session) throw error("Your session expired. Please sign in again.", 401);
    return session;
  }
  const cookie = (value, request, clear = false) =>
    `clinic_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${clear ? 0 : 28800}${process.env.COOKIE_SECURE === "true" || process.env.SITE_URL?.startsWith("https:") || new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
  async function handle(request) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return null;
    const json = (data, status = 200, headers = {}) =>
      Response.json(data, {
        status,
        headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...headers },
      });
    try {
      const action = url.pathname.slice(5);
      if (request.method === "GET" && action === "health") {
        stmt("SELECT 1").get();
        return json({ ok: true });
      }
      if (request.method !== "POST")
        return json({ message: "Method not allowed" }, 405, { Allow: "POST" });
      const origin = request.headers.get("origin");
      if (origin && origin !== (process.env.SITE_URL || url.origin).replace(/\/$/, ""))
        throw error("Request origin is not allowed.", 403);
      if (!request.headers.get("content-type")?.startsWith("application/json"))
        throw error("JSON content is required.", 415);
      if (Number(request.headers.get("content-length") || 0) > 16384)
        throw error("Request too large.", 413);
      const reader = request.body?.getReader();
      const chunks = [];
      let size = 0;
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 16384) {
            await reader.cancel();
            throw error("Request too large.", 413);
          }
          chunks.push(value);
        }
      }
      const raw = Buffer.concat(chunks).toString("utf8");
      let p;
      try {
        p = JSON.parse(raw || "{}");
      } catch {
        throw error("Invalid request.");
      }
      if (!p || typeof p !== "object" || Array.isArray(p)) throw error("Invalid request.");
      const client =
        process.env.TRUST_PROXY === "true"
          ? request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local"
          : "local";
      if (action === "settings") return json(settings());
      if (action === "available_slots") return json(slots(p.p_date));
      if (action === "book_appointment") {
        const key = reference(p.p_reference);
        const existing = stmt("SELECT * FROM appointments WHERE reference_hash=?").get(key);
        if (existing) return json(receipt(existing));
        rate(`booking:${client}`, 60);
        const telephone = phone(p.p_phone);
        rate(`phone:${telephone}`, 5);
        const name = text(p.p_name, 2, 100, "name"),
          mail = email(p.p_email),
          message = text(p.p_message || "", 0, 1000, "message");
        if (!SERVICES.includes(p.p_service)) throw error("Choose a service.");
        return json(
          transaction(() => {
            const starts = validSlot(p.p_starts_at),
              id = randomUUID();
            stmt("INSERT INTO appointments VALUES(?,?,?,?,?,?,?,?,?,?)").run(
              id,
              key,
              name,
              telephone,
              mail,
              p.p_service,
              starts,
              message,
              "pending",
              new Date().toISOString(),
            );
            log(id, "requested", "patient");
            return receipt(stmt("SELECT * FROM appointments WHERE id=?").get(id));
          }),
          201,
        );
      }
      if (action === "manage_appointment") {
        rate(`lookup:${client}`, 120);
        return json(
          transaction(() => {
            const a = stmt("SELECT * FROM appointments WHERE reference_hash=?").get(
              reference(p.p_reference),
            );
            receipt(a);
            if (p.p_cancel || p.p_starts_at) {
              if (
                !["pending", "confirmed"].includes(a.status) ||
                new Date(a.starts_at) <= new Date()
              )
                throw error("Please call the clinic to change this appointment.");
              if (p.p_cancel) {
                stmt("UPDATE appointments SET status='cancelled' WHERE id=?").run(a.id);
                log(a.id, "cancelled", "patient");
              } else {
                stmt("UPDATE appointments SET starts_at=?,status='pending' WHERE id=?").run(
                  validSlot(p.p_starts_at),
                  a.id,
                );
                log(a.id, "rescheduled", "patient");
              }
            }
            return receipt(stmt("SELECT * FROM appointments WHERE id=?").get(a.id));
          }),
        );
      }
      if (action === "contact") {
        rate(`contact:${client}`, 20);
        if (p.website) throw error("Unable to submit this message.");
        const id = randomUUID();
        stmt(
          "INSERT INTO messages(id,name,phone,email,message,created_at) VALUES(?,?,?,?,?,?)",
        ).run(
          id,
          text(p.name, 2, 100, "name"),
          phone(p.phone),
          email(p.email),
          text(p.message, 10, 2000, "message (10–2000 characters)"),
          new Date().toISOString(),
        );
        return json({ id }, 201);
      }
      if (action === "login") {
        rate(`login-client:${client}`, 40);
        const username = text(p.username, 3, 100, "username").toLowerCase();
        rate(`login:${client}:${username}`, 8);
        const password = text(p.password, 1, 128, "password");
        const account = stmt("SELECT * FROM owners WHERE username=?").get(username);
        const dummy = "00000000000000000000000000000000:" + "0".repeat(128);
        if (!(await passwordMatches(password, account?.password_hash || dummy)) || !account)
          throw error("Username or password is incorrect.", 401);
        const token = randomBytes(32).toString("hex");
        stmt("DELETE FROM sessions WHERE expires<?").run(Date.now());
        stmt("INSERT INTO sessions VALUES(?,?,?)").run(
          hash(token),
          account.id,
          Date.now() + 28800000,
        );
        return json({ username: account.username }, 200, { "Set-Cookie": cookie(token, request) });
      }
      if (action === "logout") {
        const token = request.headers
          .get("cookie")
          ?.split(";")
          .map((v) => v.trim())
          .find((v) => v.startsWith("clinic_session="))
          ?.slice(15);
        if (token) stmt("DELETE FROM sessions WHERE token_hash=?").run(hash(token));
        return json({ ok: true }, 200, { "Set-Cookie": cookie("", request, true) });
      }
      const account = owner(request);
      if (action === "session") return json(account);
      if (action === "owner_appointments")
        return json(stmt("SELECT * FROM appointments ORDER BY starts_at DESC").all().map(receipt));
      if (action === "owner_update_appointment")
        return json(
          transaction(() => {
            const a = stmt("SELECT * FROM appointments WHERE id=?").get(p.p_id);
            receipt(a);
            if (!["pending", "confirmed"].includes(a.status))
              throw error("This appointment is already closed.");
            if (p.p_starts_at) {
              if (new Date(a.starts_at) <= new Date())
                throw error("A past appointment cannot be rescheduled.");
              stmt("UPDATE appointments SET starts_at=?,status='confirmed' WHERE id=?").run(
                validSlot(p.p_starts_at),
                a.id,
              );
              log(a.id, "rescheduled", account.id);
            } else {
              if (!["confirmed", "cancelled", "completed"].includes(p.p_status))
                throw error("Invalid status change.");
              if (p.p_status === "completed" && new Date(a.starts_at) > new Date())
                throw error("A future appointment cannot be completed.");
              if (p.p_status === "confirmed" && new Date(a.starts_at) <= new Date())
                throw error("A past appointment cannot be confirmed.");
              stmt("UPDATE appointments SET status=? WHERE id=?").run(p.p_status, a.id);
              log(a.id, p.p_status, account.id);
            }
            return receipt(stmt("SELECT * FROM appointments WHERE id=?").get(a.id));
          }),
        );
      if (action === "owner_settings") {
        if (p.update) {
          if (
            !Number.isInteger(p.opening) ||
            !Number.isInteger(p.closing) ||
            p.opening < 0 ||
            p.closing > 24 ||
            p.opening >= p.closing ||
            !Array.isArray(p.days) ||
            !p.days.length ||
            p.days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)
          )
            throw error("Choose valid clinic hours and at least one working day.");
          stmt("UPDATE settings SET opening=?,closing=?,days=? WHERE id=1").run(
            p.opening,
            p.closing,
            JSON.stringify([...new Set(p.days)]),
          );
        }
        return json(settings());
      }
      if (action === "owner_closures") {
        if (p.date)
          transaction(() => {
            slots(p.date);
            if (p.remove) stmt("DELETE FROM closures WHERE date=?").run(p.date);
            else {
              if (
                stmt(
                  "SELECT 1 FROM appointments WHERE status IN ('pending','confirmed') AND substr(datetime(starts_at,'+5 hours'),1,10)=?",
                ).get(p.date)
              )
                throw error("Reschedule or cancel appointments on this date before closing it.");
              stmt("INSERT OR REPLACE INTO closures VALUES(?,?)").run(
                p.date,
                text(p.reason || "Clinic closed", 1, 200, "reason"),
              );
            }
          });
        return json(stmt("SELECT * FROM closures ORDER BY date").all());
      }
      if (action === "owner_messages") {
        if (p.id) stmt("UPDATE messages SET read=1 WHERE id=?").run(p.id);
        return json(stmt("SELECT * FROM messages ORDER BY created_at DESC").all());
      }
      if (action === "owner_password") {
        rate(`password:${account.id}`, 8);
        const current = text(p.current, 1, 128, "current password"),
          next = text(p.password, 12, 128, "new password (12–128 characters)");
        const row = stmt("SELECT * FROM owners WHERE id=?").get(account.id);
        if (!(await passwordMatches(current, row.password_hash)))
          throw error("Current password is incorrect.");
        stmt("UPDATE owners SET password_hash=? WHERE id=?").run(
          await passwordHash(next),
          account.id,
        );
        stmt("DELETE FROM sessions WHERE owner_id=?").run(account.id);
        return json({ ok: true }, 200, { "Set-Cookie": cookie("", request, true) });
      }
      throw error("Not found.", 404);
    } catch (e) {
      if (e.status) return json({ message: e.message }, e.status);
      if (String(e.message).includes("UNIQUE constraint failed: appointments.starts_at"))
        return json({ message: "That time was just booked. Choose another." }, 409);
      console.error("Clinic API error", e.code || e.name);
      return json(
        { message: "Unable to complete your request. Please try again or call the clinic." },
        500,
      );
    }
  }
  return { handle, db, createOwner, settings, slots, close: () => db.close() };
}
let clinic;
export function handleClinicRequest(request) {
  clinic ||= createClinic();
  return clinic.handle(request);
}
