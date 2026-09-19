import { createClinic, passwordHash } from "../server/clinic.mjs";
import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
const clinic = createClinic();
const username = process.env.OWNER_USERNAME || "owner";
const owner = clinic.db.prepare("SELECT id FROM owners WHERE username=?").get(username);
if (!owner) {
  clinic.close();
  throw new Error("Owner not found. Set OWNER_USERNAME to the account to reset.");
}
const password = randomBytes(18).toString("base64url");
mkdirSync(".data", { recursive: true });
clinic.db
  .prepare("UPDATE owners SET password_hash=? WHERE id=?")
  .run(await passwordHash(password), owner.id);
clinic.db.prepare("DELETE FROM sessions WHERE owner_id=?").run(owner.id);
writeFileSync(
  ".data/OWNER-ACCESS.txt",
  `Multan Dental owner access\n\nUsername: ${username}\nPassword: ${password}\n\nChange this password in Hours & account after signing in.\n`,
  { mode: 0o600 },
);
clinic.close();
console.log(
  "Owner password reset. New credentials saved privately to .data/OWNER-ACCESS.txt. All sessions revoked.",
);
