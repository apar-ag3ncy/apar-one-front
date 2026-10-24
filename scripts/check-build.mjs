import fs from "node:fs";
import { gzipSync } from "node:zlib";

// Includes each route's root layout once, so global client code cannot hide in shared chunks.
const manifestPath = ".next/app-build-manifest.json";
if (!fs.existsSync(manifestPath)) throw new Error("Run npm run build before checking the production budget.");
const { pages } = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const budgets = JSON.parse(fs.readFileSync("docs/performance-budgets.json", "utf8"));
const results = {};
for (const [route, budget] of Object.entries(budgets)) {
  if (!pages[route]) throw new Error(`Built route missing: ${route}`);
  const ancestors = Object.keys(pages).filter(key => key.endsWith("/layout") && route.startsWith(key.slice(0, -"layout".length)));
  const files = [...new Set([...ancestors.flatMap(key => pages[key]), ...pages[route]])];
  const bytes = { js: 0, css: 0 };
  for (const file of files) {
    const kind = file.endsWith(".js") ? "js" : file.endsWith(".css") ? "css" : null;
    if (kind) bytes[kind] += gzipSync(fs.readFileSync(`.next/${file}`)).length;
  }
  results[route] = bytes;
  for (const kind of ["js", "css"]) {
    if (bytes[kind] > budget[kind]) {
      console.error(`${route} ${kind}: ${bytes[kind]} bytes exceeds ${budget[kind]} byte gzip budget.`);
      process.exitCode = 1;
    }
  }
}
console.table(Object.fromEntries(Object.entries(results).map(([route, size]) => [route, {
  "JS gzip KiB": (size.js / 1024).toFixed(1), "CSS gzip KiB": (size.css / 1024).toFixed(1),
}])));
fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/production-bundles.json", JSON.stringify(results, null, 2) + "\n");
console.log("Compiled route assets only; this is not a Lighthouse score or a real-device timing test.");
