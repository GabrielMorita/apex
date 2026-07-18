import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";

const root = process.cwd();
const requiredFiles = [
  "supabase/migrations/20260718060000_privacy_lgpd_foundation.sql",
  "supabase/migrations/20260718070000_launch_readiness.sql",
  "docs/CHANGELOG_V0.60.0_BETA_RC.md",
  "docs/INSTRUCOES_V0.60.0_BETA_RC.md",
  "docs/CHECKLIST_LANCAMENTO_BETA.md",
  "Dockerfile",
  ".github/workflows/ci.yml",
];

async function text(path) {
  return readFile(join(root, path), "utf8");
}

async function collect(directory) {
  const entries = await readdir(join(root, directory), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(relative));
    else if ([".ts", ".tsx", ".js", ".mjs", ".sql", ".json", ".yml", ".yaml"].includes(extname(entry.name))) files.push(relative);
  }
  return files;
}

const packageJson = JSON.parse(await text("package.json"));
if (packageJson.version !== "0.60.0") throw new Error(`Versão inesperada: ${packageJson.version}`);

for (const path of requiredFiles) await readFile(join(root, path));

const envExample = await text(".env.example");
for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_DATA_CONTROLLER_NAME", "NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL", "NEXT_PUBLIC_SUPPORT_EMAIL", "APEX_BILLING_ENABLED", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "SUPABASE_SECRET_KEY"]) {
  if (!envExample.includes(`${key}=`)) throw new Error(`Variável ausente no .env.example: ${key}`);
}
if (!envExample.includes("APEX_BILLING_ENABLED=false")) throw new Error("A cobrança deve permanecer desativada neste release.");
if (!(await text(".gitignore")).includes(".env.local")) throw new Error(".env.local precisa permanecer ignorado.");

const scanFiles = ["package.json", "next.config.mjs", ...await collect("src"), ...await collect("supabase/migrations"), ...await collect("scripts")];
const secretPatterns = [
  /sk_(?:live|test)_[A-Za-z0-9]{16,}/,
  /whsec_[A-Za-z0-9]{16,}/,
  /sb_secret_[A-Za-z0-9_-]{16,}/,
  /SUPABASE_SECRET_KEY\s*=\s*[^\s"']+/,
];
for (const path of scanFiles) {
  const contents = await text(path);
  const match = secretPatterns.find((pattern) => pattern.test(contents));
  if (match) throw new Error(`Possível segredo encontrado em ${path}.`);
}

console.log(JSON.stringify({ status: "ok", version: packageJson.version, billing: "disabled", filesScanned: scanFiles.length }, null, 2));
