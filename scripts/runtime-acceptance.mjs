import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = new Set(process.argv.slice(2));
const withDb = args.has("--db");
const withSeed = args.has("--seed");
const withBrowser = args.has("--browser");
const port = Number(process.env.RUNTIME_ACCEPTANCE_PORT || 3100);
const baseUrl = process.env.RUNTIME_ACCEPTANCE_BASE_URL || `http://127.0.0.1:${port}`;

function run(command, commandArgs, options = {}) {
  console.log(`\n> ${command} ${commandArgs.join(" ")}`);
  const result = spawnSync(command, commandArgs, { cwd: process.cwd(), env: process.env, stdio: "inherit", ...options });
  if (result.status !== 0) throw new Error(`${command} ${commandArgs.join(" ")} failed with exit code ${result.status}`);
}

async function waitReady(url, timeoutMs = 60_000) {
  const started = Date.now();
  let last = "not attempted";
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      last = `${response.status} ${await response.text()}`;
      if (response.ok) return;
    } catch (error) { last = error.message; }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Application readiness timed out: ${last}`);
}

if (!fs.existsSync(path.join(process.cwd(), "node_modules"))) {
  console.error("node_modules is missing. Run npm install first. If registry DNS is unavailable, runtime acceptance cannot continue in this environment.");
  process.exit(2);
}

run("npm", ["run", "runtime:preflight"]);
run("npm", ["run", "prisma:generate"]);
run("npm", ["run", "prisma:validate"]);
run("npm", ["run", "typecheck"]);
run("npm", ["test"]);

if (withDb) {
  if (!process.env.DATABASE_URL && !fs.existsSync(path.join(process.cwd(), ".env"))) throw new Error("--db requires DATABASE_URL or a project .env file");
  run("npx", ["prisma", "db", "push", "--skip-generate"]);
}
if (withSeed) run("npm", ["run", "db:seed"]);

run("npm", ["run", "build"]);

let server;
try {
  server = spawn("npm", ["run", "start"], {
    cwd: process.cwd(), env: { ...process.env, PORT: String(port), HOSTNAME: "127.0.0.1" }, stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (chunk) => process.stdout.write(`[app] ${chunk}`));
  server.stderr.on("data", (chunk) => process.stderr.write(`[app] ${chunk}`));
  await waitReady(`${baseUrl}/api/ready`);
  console.log(`\nPASS application readiness: ${baseUrl}/api/ready`);
  const home = await fetch(baseUrl, { redirect: "manual" });
  if (home.status >= 500) throw new Error(`Home page returned ${home.status}`);
  console.log(`PASS public HTTP smoke: / -> ${home.status}`);
  if (withBrowser) run("node", ["scripts/browser-role-qa.mjs"], { env: { ...process.env, DRISHTIRECRUIT_BASE_URL: baseUrl } });
} finally {
  if (server && !server.killed) server.kill("SIGTERM");
}

console.log("\nDrishtiRecruit runtime acceptance completed successfully.");
