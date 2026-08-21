import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcRoot = path.join(root, "src");
const errors = [];
function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => { const full = path.join(dir, entry.name); return entry.isDirectory() ? walk(full) : [full]; }); }
function existsModule(base) {
  return [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.mjs`, path.join(base, "index.ts"), path.join(base, "index.tsx")].some((candidate) => fs.existsSync(candidate));
}
const files = walk(srcRoot).filter((file) => /\.(ts|tsx)$/.test(file) && !file.startsWith(`${path.join(srcRoot, "generated")}${path.sep}`));
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  if (text.includes('"use client"') || text.includes("'use client'")) {
    const cleaned = text.replace(/^\uFEFF/, "").trimStart();
    if (!cleaned.startsWith('"use client"') && !cleaned.startsWith("'use client'")) errors.push(`${path.relative(root, file)}: use client directive is not first`);
  }
  const imports = [...text.matchAll(/(?:from\s+|import\s*\()(["'])([^"']+)\1/g)].map((m) => m[2]);
  for (const spec of imports) {
    if (spec.startsWith("@/")) {
      const target = path.join(srcRoot, spec.slice(2));
      if (!existsModule(target) && !spec.startsWith("@/generated/prisma")) errors.push(`${path.relative(root, file)}: unresolved local import ${spec}`);
    } else if (spec.startsWith(".")) {
      const target = path.resolve(path.dirname(file), spec.replace(/\.js$/, ""));
      if (!existsModule(target)) errors.push(`${path.relative(root, file)}: unresolved relative import ${spec}`);
    }
  }
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const versionSource = fs.readFileSync(path.join(srcRoot, "lib", "version.ts"), "utf8");
const openapi = fs.readFileSync(path.join(root, "docs", "openapi.yaml"), "utf8");
if (!versionSource.includes(`APP_VERSION = "${pkg.version}"`)) errors.push("src/lib/version.ts does not match package.json version");
if (!new RegExp(`^  version: ${pkg.version.replaceAll(".", "\\.")}$`, "m").test(openapi)) errors.push("docs/openapi.yaml info.version does not match package.json");
if (fs.readFileSync(path.join(root, "public", "openapi.yaml"), "utf8") !== openapi) errors.push("public/openapi.yaml is not synchronized with docs/openapi.yaml");
const docsPostman = fs.readFileSync(path.join(root, "docs", "DrishtiRecruit.postman_collection.json"), "utf8");
if (fs.readFileSync(path.join(root, "public", "DrishtiRecruit.postman_collection.json"), "utf8") !== docsPostman) errors.push("public Postman collection is not synchronized with docs copy");

console.log(`Source integrity scanned ${files.length} TS/TSX files.`);
if (errors.length) { console.error(`Found ${errors.length} issue(s):`); for (const error of errors) console.error(`- ${error}`); process.exit(1); }
console.log("Source integrity passed: local imports, client directives, version metadata and public OpenAPI synchronization are consistent.");
