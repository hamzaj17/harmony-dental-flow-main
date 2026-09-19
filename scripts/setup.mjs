import { createClinic } from "../server/clinic.mjs";
import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
const clinic = createClinic();
if (!clinic.db.prepare("SELECT 1 FROM owners LIMIT 1").get()) {
  const username = process.env.OWNER_USERNAME || "owner";
  const password = process.env.OWNER_PASSWORD || randomBytes(18).toString("base64url");
  await clinic.createOwner(username, password);
  mkdirSync(".data", { recursive: true });
  writeFileSync(
    ".data/OWNER-ACCESS.txt",
    `Multan Dental owner access\n\nUsername: ${username}\nPassword: ${password}\n\nOpen /owner to sign in. Change this password in Account after signing in.\nKeep this file private; it is excluded from version control.\n`,
    { mode: 0o600 },
  );
  console.log("Database initialized. Owner credentials saved privately to .data/OWNER-ACCESS.txt.");
} else console.log("Database ready. Existing owner account preserved.");
clinic.close();
