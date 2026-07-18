import { spawn } from "node:child_process";

const port = 3187;
const origin = `http://127.0.0.1:${port}`;
const logs = [];
const server = spawn(process.execPath, [".next/standalone/server.js"], {
  cwd: process.cwd(),
  env: { ...process.env, HOSTNAME: "127.0.0.1", PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", (chunk) => logs.push(String(chunk)));
server.stderr.on("data", (chunk) => logs.push(String(chunk)));

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function ready() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Servidor encerrou antes do smoke.\n${logs.join("")}`);
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) return response;
    } catch {}
    await wait(100);
  }
  throw new Error(`Servidor não ficou disponível.\n${logs.join("")}`);
}

try {
  const healthResponse = await ready();
  const health = await healthResponse.json();
  if (health.status !== "ok" || health.version !== "0.60.0") throw new Error("Health check retornou conteúdo inesperado.");

  const results = [];
  for (const [path, expected] of [["/termos", "Termos de Uso do Apex"], ["/privacidade", "Aviso de Privacidade do Apex"], ["/suporte", "Suporte"]]) {
    const response = await fetch(`${origin}${path}`);
    const body = await response.text();
    if (!response.ok || !body.includes(expected)) throw new Error(`Smoke falhou em ${path}.`);
    if (!response.headers.get("content-security-policy")) throw new Error(`CSP ausente em ${path}.`);
    results.push({ path, status: response.status });
  }
  console.log(JSON.stringify({ health, pages: results, csp: "present" }, null, 2));
} finally {
  server.kill("SIGTERM");
}
