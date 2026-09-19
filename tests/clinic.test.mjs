import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { unlinkSync, existsSync } from "node:fs";
import { createClinic } from "../server/clinic.mjs";
import { telHref } from "../src/lib/appointments.ts";
const password = "Test-only-password-2026!";
const tomorrow = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Karachi",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date(Date.now() + 86400000));
function request(c, action, body = {}, cookie = "", headers = {}) {
  return c.handle(
    new Request(`http://localhost/api/${action}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost",
        ...(cookie ? { cookie } : {}),
        ...headers,
      },
      body: JSON.stringify(body),
    }),
  );
}
const booking = (c, extra = {}) => ({
  p_reference: randomUUID(),
  p_name: "Test Patient",
  p_phone: "0311 7594193",
  p_email: "patient@example.com",
  p_service: "Checkup & Cleaning",
  p_starts_at: c.slots(tomorrow)[0]?.starts_at,
  p_message: "A test request",
  ...extra,
});
async function auth(c) {
  await c.createOwner("owner", password);
  const r = await request(c, "login", { username: "owner", password });
  assert.equal(r.status, 200);
  assert.match(r.headers.get("set-cookie"), /HttpOnly; SameSite=Strict/);
  return r.headers.get("set-cookie").split(";")[0];
}
const withClinic = (fn) => async () => {
  const c = createClinic(":memory:");
  try {
    await fn(c);
  } finally {
    c.close();
  }
};

test("dial links normalize local numbers to mobile-call format", () => {
  assert.equal(telHref("0311 7594193"), "tel:+923117594193");
  assert.equal(telHref("+92 311 7594193"), "tel:+923117594193");
  assert.equal(telHref("923117594193"), "tel:+923117594193");
});
test(
  "booking saves privately, retries are idempotent, and simultaneous requests cannot double-book",
  withClinic(async (c) => {
    const b = booking(c);
    const results = await Promise.all([
      request(c, "book_appointment", b),
      request(c, "book_appointment", { ...b, p_reference: randomUUID() }),
    ]);
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
    const a = await results[0].json();
    assert.equal(a.status, "pending");
    assert.equal(a.phone, "03117594193");
    assert.equal(a.reference_hash, undefined);
    assert.equal(c.slots(tomorrow).length, 11);
    const retry = await request(c, "book_appointment", b);
    assert.equal((await retry.json()).id, a.id);
    assert.equal(c.db.prepare("SELECT count(*) n FROM appointments").get().n, 1);
    const stored = c.db.prepare("SELECT reference_hash FROM appointments").get();
    assert.notEqual(stored.reference_hash, b.p_reference);
  }),
);
test(
  "server validates dates, contact fields and service when UI is bypassed",
  withClinic(async (c) => {
    for (const value of [
      { p_phone: "bad" },
      { p_name: " " },
      { p_email: "bad" },
      { p_service: "Unknown" },
      { p_starts_at: "invalid" },
      { p_starts_at: `${tomorrow}T10:00:00+05:00` },
      { p_starts_at: new Date(Date.now() - 86400000).toISOString() },
    ]) {
      const r = await request(c, "book_appointment", booking(c, value));
      assert.notEqual(r.status, 201);
    }
    assert.equal((await request(c, "available_slots", { p_date: "2026-02-31" })).status, 400);
    assert.equal(c.slots("2099-01-01").length, 0);
  }),
);
test(
  "owner authentication protects records, survives requests and logout revokes access",
  withClinic(async (c) => {
    assert.equal((await request(c, "owner_appointments")).status, 401);
    assert.equal(
      (await request(c, "login", { username: "owner", password: "incorrect" })).status,
      401,
    );
    const cookie = await auth(c);
    assert.equal((await request(c, "session", {}, cookie)).status, 200);
    assert.equal((await request(c, "owner_appointments", {}, cookie)).status, 200);
    await request(c, "logout", {}, cookie);
    assert.equal((await request(c, "session", {}, cookie)).status, 401);
  }),
);
test(
  "owner confirms, reschedules; patient checks and cancels; cancelled slot is released",
  withClinic(async (c) => {
    const cookie = await auth(c),
      b = booking(c);
    const a = await (await request(c, "book_appointment", b)).json();
    assert.equal(
      (await request(c, "owner_update_appointment", { p_id: a.id, p_status: "completed" }, cookie))
        .status,
      400,
    );
    assert.equal(
      (await request(c, "owner_update_appointment", { p_id: a.id, p_status: "confirmed" }, cookie))
        .status,
      200,
    );
    assert.equal(
      (await (await request(c, "manage_appointment", { p_reference: b.p_reference })).json())
        .status,
      "confirmed",
    );
    const next = c.slots(tomorrow)[0].starts_at;
    const moved = await request(
      c,
      "owner_update_appointment",
      { p_id: a.id, p_starts_at: next },
      cookie,
    );
    assert.equal((await moved.json()).starts_at, next);
    assert.equal(
      (await request(c, "manage_appointment", { p_reference: randomUUID() })).status,
      404,
    );
    const cancelled = await request(c, "manage_appointment", {
      p_reference: b.p_reference,
      p_cancel: true,
    });
    assert.equal((await cancelled.json()).status, "cancelled");
    assert.equal(c.slots(tomorrow).length, 12);
    assert.equal(
      (await request(c, "owner_update_appointment", { p_id: a.id, p_status: "confirmed" }, cookie))
        .status,
      400,
    );
  }),
);
test(
  "clinic hours and closures control availability and cannot hide active appointments",
  withClinic(async (c) => {
    const cookie = await auth(c);
    await request(
      c,
      "owner_settings",
      { update: true, opening: 17, closing: 20, days: [0, 1, 2, 3, 4, 5, 6] },
      cookie,
    );
    assert.equal(c.slots(tomorrow).length, 6);
    assert.equal(
      (
        await request(
          c,
          "owner_settings",
          { update: true, opening: 22, closing: 16, days: [0] },
          cookie,
        )
      ).status,
      400,
    );
    await request(c, "owner_closures", { date: tomorrow, reason: "Holiday" }, cookie);
    assert.equal(c.slots(tomorrow).length, 0);
    await request(c, "owner_closures", { date: tomorrow, remove: true }, cookie);
    const b = booking(c);
    await request(c, "book_appointment", b);
    assert.equal(
      (await request(c, "owner_closures", { date: tomorrow, reason: "Holiday" }, cookie)).status,
      400,
    );
  }),
);
test(
  "enquiries persist, are private, and can be marked read",
  withClinic(async (c) => {
    const r = await request(c, "contact", {
      name: "Test Person",
      phone: "03117594193",
      email: "",
      message: "Please call me about an appointment.",
    });
    assert.equal(r.status, 201);
    assert.equal((await request(c, "owner_messages")).status, 401);
    const cookie = await auth(c);
    const messages = await (await request(c, "owner_messages", {}, cookie)).json();
    assert.equal(messages.length, 1);
    assert.equal(messages[0].read, 0);
    assert.equal(
      (await (await request(c, "owner_messages", { id: messages[0].id }, cookie)).json())[0].read,
      1,
    );
  }),
);
test(
  "cross-origin writes, repeated logins and oversized bodies are rejected",
  withClinic(async (c) => {
    assert.equal(
      (await request(c, "contact", {}, "", { origin: "https://evil.example" })).status,
      403,
    );
    assert.equal((await request(c, "contact", { message: "x".repeat(17000) })).status, 413);
    for (let i = 0; i < 8; i++)
      await request(c, "login", { username: "nobody", password: "wrong" });
    assert.equal(
      (await request(c, "login", { username: "nobody", password: "wrong" })).status,
      429,
    );
  }),
);
test(
  "changing password requires current password and revokes all sessions",
  withClinic(async (c) => {
    const cookie = await auth(c);
    assert.equal(
      (
        await request(
          c,
          "owner_password",
          { current: "wrong", password: "Replacement-password!" },
          cookie,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await request(
          c,
          "owner_password",
          { current: password, password: "Replacement-password!" },
          cookie,
        )
      ).status,
      200,
    );
    assert.equal((await request(c, "session", {}, cookie)).status, 401);
    assert.equal(
      (await request(c, "login", { username: "owner", password: "Replacement-password!" })).status,
      200,
    );
  }),
);
test("appointments and owner account survive database restart", async () => {
  const filename = `.verification/persistence-${randomUUID()}.sqlite`;
  let c = createClinic(filename);
  try {
    await c.createOwner("owner", password);
    const b = booking(c);
    const a = await (await request(c, "book_appointment", b)).json();
    c.close();
    c = createClinic(filename);
    assert.equal(
      (await (await request(c, "manage_appointment", { p_reference: b.p_reference })).json()).id,
      a.id,
    );
    assert.equal((await request(c, "login", { username: "owner", password })).status, 200);
  } finally {
    c.close();
    for (const suffix of ["", "-wal", "-shm"])
      if (existsSync(filename + suffix)) unlinkSync(filename + suffix);
  }
});
