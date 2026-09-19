export const services = [
  "Checkup & Cleaning",
  "Teeth Whitening",
  "Braces / Invisalign",
  "Dental Implants",
  "Cosmetic Dentistry",
  "Emergency Care",
  "Root Canal Treatment",
  "Dentures & Crowns",
];
export type Appointment = {
  id: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  starts_at: string;
  message: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
};
export type Settings = {
  opening: number;
  closing: number;
  days: number[];
  timezone: string;
  services: string[];
};
export type Message = {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  read: number;
  created_at: string;
};
export function clinicDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function displayTime(value: string) {
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: "Asia/Karachi",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
export function shortTime(value: string) {
  return new Date(value).toLocaleTimeString("en-PK", {
    timeZone: "Asia/Karachi",
    hour: "numeric",
    minute: "2-digit",
  });
}
export function telHref(phone: string) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "tel:";
  const local = digits.startsWith("92") ? digits.slice(2) : digits;
  const normalized = local.startsWith("0") ? local.slice(1) : local;
  return `tel:+92${normalized}`;
}
export async function rpc<T>(action: string, body: unknown = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/${action}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new Error("Connection interrupted. Please try again. Your details have been kept.");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw Object.assign(new Error(data?.message || "Unable to complete this request."), {
      status: response.status,
    });
  return data as T;
}
export const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong. Please try again.";
