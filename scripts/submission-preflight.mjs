import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "README.md",
  ".env.example",
  "Dockerfile",
  "docker-compose.full.yml",
  ".github/workflows/ci.yml",
  "docs/openapi.yaml",
  "docs/DrishtiRecruit.postman_collection.json",
  "docs/ER_DIAGRAM.md",
  "docs/ARCHITECTURE.md",
  "docs/PS2_COMPLIANCE_MATRIX.md",
  "docs/DEMO_CREDENTIALS.md",
  "docs/FINAL_DEMO_FLOW.md",
  "docs/JUDGE_GUIDE.md",
  "docs/RUBRIC_MAPPING.md",
  "public/manifest.webmanifest",
  "public/icon-192.png",
  "public/icon-512.png",
];
const errors = [];
const warnings = [];
for (const file of required) if (!fs.existsSync(path.join(root, file))) errors.push(`Missing required submission artifact: ${file}`);

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (!/^\d+\.\d+\.\d+$/.test(pkg.version)) errors.push(`package.json version is not semantic versioning: ${pkg.version}`);
for (const script of ["qa:static", "submission:preflight", "typecheck", "test", "build"]) if (!pkg.scripts?.[script]) errors.push(`Missing npm script: ${script}`);


const serviceWorker = fs.readFileSync(path.join(root, "public/sw.js"), "utf8");
if (/PUBLIC_ASSETS\s*=\s*\[[^\]]*["']\/["']/s.test(serviceWorker)) errors.push("Service worker must not pre-cache the personalized root route.");
if (!serviceWorker.includes('url.pathname.startsWith("/api/")')) errors.push("Service worker lacks explicit API cache exclusion.");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "public/manifest.webmanifest"), "utf8"));
if (manifest.name !== "DrishtiRecruit — Evidence-backed hiring") warnings.push("PWA manifest product name changed; verify submission branding.");
if (!Array.isArray(manifest.icons) || manifest.icons.length < 2) errors.push("PWA manifest does not include install icons.");

const openapi = fs.readFileSync(path.join(root, "docs/openapi.yaml"), "utf8");
const apiRoutes = [];
function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => { const full = path.join(dir, entry.name); return entry.isDirectory() ? walk(full) : [full]; }); }
function routePath(file) { const rel = path.relative(path.join(root, "src", "app"), path.dirname(file)).replaceAll(path.sep, "/"); return `/${rel}`.replace(/\[([^\]]+)\]/g, "{$1}"); }
for (const file of walk(path.join(root, "src", "app", "api")).filter((file) => file.endsWith(`${path.sep}route.ts`))) apiRoutes.push(routePath(file));
const documented = new Set([...openapi.matchAll(/^  (\/api\/[^:]+):\s*$/gm)].map((match) => match[1]));
for (const route of apiRoutes) if (!documented.has(route)) errors.push(`OpenAPI missing route: ${route}`);

const env = fs.readFileSync(path.join(root, ".env.example"), "utf8");
for (const variable of ["DATABASE_URL", "JWT_SECRET", "APP_URL", "TWO_FACTOR_ENCRYPTION_KEY"]) if (!env.includes(`${variable}=`)) errors.push(`.env.example missing ${variable}`);

const compliance = fs.readFileSync(path.join(root, "docs/PS2_COMPLIANCE_MATRIX.md"), "utf8");
for (const term of ["Job management", "AI resume parsing", "Interview scheduling", "Offer letters", "Admin panel", "2FA", "PWA"]) if (!compliance.includes(term)) warnings.push(`Compliance matrix does not mention: ${term}`);

const source = walk(path.join(root, "src")).filter((file) => /\.(ts|tsx)$/.test(file)).map((file) => fs.readFileSync(file, "utf8")).join("\n");
if (/\b(9[5-9]|100)% accuracy\b/i.test(source)) warnings.push("Source appears to contain an unsupported high accuracy claim; review before submission.");
if (source.includes("AI automatically rejects")) errors.push("Autonomous rejection language found; DrishtiRecruit is intended to keep final decisions human-owned.");

console.log(`DrishtiRecruit submission preflight: ${apiRoutes.length} API routes, ${required.length} required artifact checks.`);
for (const warning of warnings) console.warn(`WARN: ${warning}`);
if (errors.length) {
  console.error(`FAILED with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log("PASS: submission artifact inventory, OpenAPI route inventory, PWA files and safety assertions are consistent.");
