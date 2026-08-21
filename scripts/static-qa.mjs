import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const apiRoot = path.join(root, "src", "app", "api");
const findings = [];
const publicRoutes = new Set([
  "/api/health",
  "/api/ready",
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
  "/api/auth/google/start",
  "/api/auth/google/callback",
  "/api/auth/2fa/login/verify",
  "/api/auth/logout",
]);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function routePath(file) {
  const rel = path.relative(path.join(root, "src", "app"), path.dirname(file)).replaceAll(path.sep, "/");
  return `/${rel}`.replace(/\[([^\]]+)\]/g, "{$1}");
}

const routeFiles = walk(apiRoot).filter((file) => file.endsWith(`${path.sep}route.ts`));
const routePaths = [];
for (const file of routeFiles) {
  const text = fs.readFileSync(file, "utf8");
  const route = routePath(file);
  routePaths.push(route);
  const methods = [...text.matchAll(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\b/g)].map((m) => m[1]);
  const mutating = methods.some((method) => method !== "GET");
  if (mutating && !text.includes("assertSameOrigin")) findings.push(`${route}: mutating route lacks assertSameOrigin`);
  if (!publicRoutes.has(route) && !/(requireUser|requireRole|requireVerifiedRole|getSessionUser)/.test(text)) findings.push(`${route}: protected route lacks explicit session/role check`);
  if (text.includes('headers.get("x-forwarded-for")')) findings.push(`${route}: reads x-forwarded-for directly instead of clientAddress()`);
}

const openApi = fs.readFileSync(path.join(root, "docs", "openapi.yaml"), "utf8");
const documentedPaths = new Set([...openApi.matchAll(/^  (\/api\/[^:]+):\s*$/gm)].map((m) => m[1]));
for (const route of routePaths) if (!documentedPaths.has(route)) findings.push(`${route}: missing from docs/openapi.yaml`);
for (const route of documentedPaths) if (!routePaths.includes(route)) findings.push(`${route}: documented OpenAPI path has no route.ts`);

const sourceFiles = walk(path.join(root, "src")).filter((file) => /\.(ts|tsx)$/.test(file));
const secretPattern = /(sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{20,}|ghp_[0-9A-Za-z]{20,})/g;
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, "utf8");
  if (secretPattern.test(text)) findings.push(`${path.relative(root, file)}: looks like a hard-coded live secret`);
  secretPattern.lastIndex = 0;
}

console.log(`Static QA scanned ${routeFiles.length} API routes and ${sourceFiles.length} TS/TSX source files.`);
if (findings.length) {
  console.error(`Found ${findings.length} issue(s):`);
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
console.log("Static QA passed: route auth/origin heuristics, OpenAPI coverage, proxy-header usage and obvious-secret scan are clear.");
