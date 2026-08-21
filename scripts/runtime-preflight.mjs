import fs from "node:fs";
import net from "node:net";
import dns from "node:dns/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const results = [];
const add = (name, status, detail) => results.push({ name, status, detail });

function parseEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    out[key] = value;
  }
  return out;
}

function commandExists(command) {
  const probe = process.platform === "win32" ? ["where", [command]] : ["sh", ["-lc", `command -v ${command}`]];
  return spawnSync(probe[0], probe[1], { stdio: "ignore" }).status === 0;
}

function semverAtLeast(actual, minimum) {
  const a = actual.replace(/^v/, "").split(".").map(Number);
  const b = minimum.split(".").map(Number);
  for (let i = 0; i < 3; i++) { if ((a[i] ?? 0) > (b[i] ?? 0)) return true; if ((a[i] ?? 0) < (b[i] ?? 0)) return false; }
  return true;
}

async function tcpProbe(urlText) {
  try {
    const url = new URL(urlText);
    const host = url.hostname;
    const port = Number(url.port || 5432);
    return await new Promise((resolve) => {
      const socket = net.createConnection({ host, port, timeout: 2500 });
      socket.once("connect", () => { socket.destroy(); resolve({ ok: true, detail: `${host}:${port} reachable` }); });
      socket.once("timeout", () => { socket.destroy(); resolve({ ok: false, detail: `${host}:${port} timed out` }); });
      socket.once("error", (error) => resolve({ ok: false, detail: `${host}:${port} ${error.code ?? error.message}` }));
    });
  } catch (error) { return { ok: false, detail: `invalid DATABASE_URL: ${error.message}` }; }
}

const env = { ...parseEnvFile(path.join(root, ".env")), ...process.env };
add("Node.js", semverAtLeast(process.version, "22.12.0") ? "PASS" : "FAIL", `${process.version} (requires >=22.12.0)`);
add("npm", commandExists("npm") ? "PASS" : "FAIL", commandExists("npm") ? "available" : "not found");
add("dependencies", fs.existsSync(path.join(root, "node_modules")) ? "PASS" : "BLOCKED", fs.existsSync(path.join(root, "node_modules")) ? "node_modules present" : "node_modules absent; run npm install when registry access is available");
add("package lock", fs.existsSync(path.join(root, "package-lock.json")) ? "PASS" : "WARN", fs.existsSync(path.join(root, "package-lock.json")) ? "package-lock.json present" : "no package-lock.json yet; generate/commit one after the first successful npm install");
add(".env", fs.existsSync(path.join(root, ".env")) ? "PASS" : "WARN", fs.existsSync(path.join(root, ".env")) ? ".env present" : "copy .env.example to .env before DB/runtime acceptance");

try {
  const resolved = await dns.lookup("registry.npmjs.org");
  add("npm registry DNS", "PASS", resolved.address);
} catch (error) { add("npm registry DNS", "BLOCKED", `${error.code ?? error.message}`); }

const databaseUrl = env.DATABASE_URL;
if (!databaseUrl) add("PostgreSQL", "BLOCKED", "DATABASE_URL is not configured");
else {
  const db = await tcpProbe(databaseUrl);
  add("PostgreSQL", db.ok ? "PASS" : "BLOCKED", db.detail);
}

const chromiumCandidates = [env.CHROMIUM_PATH, "chromium", "chromium-browser", "google-chrome", "google-chrome-stable"].filter(Boolean);
const chromium = chromiumCandidates.find(commandExists);
add("Chromium", chromium ? "PASS" : "WARN", chromium ? `${chromium} available for browser QA` : "not found; set CHROMIUM_PATH to Chrome/Chromium for five-role browser QA");
add("Docker", commandExists("docker") ? "PASS" : "WARN", commandExists("docker") ? "available" : "not required if PostgreSQL is already running locally");

console.log("DrishtiRecruit runtime preflight\n");
for (const item of results) console.log(`${item.status.padEnd(7)} ${item.name.padEnd(20)} ${item.detail}`);
const hardFailures = results.filter((item) => item.status === "FAIL");
if (hardFailures.length) process.exitCode = 1;
