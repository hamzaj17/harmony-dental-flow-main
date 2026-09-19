import { backup, DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
const db = new DatabaseSync(process.env.DATABASE_PATH || ".data/clinic.sqlite");
mkdirSync(".data/backups", { recursive: true });
const target = `.data/backups/clinic-${new Date().toISOString().replace(/[:.]/g, "-")}.sqlite`;
await backup(db, target);
db.close();
console.log(`Backup saved: ${target}`);
