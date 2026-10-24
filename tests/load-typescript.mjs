import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(path.join(process.cwd(), "package.json"));
const cache = new Map();

/** Node-only data tests; production boundaries are checked separately from the import graph. */
export function loadTypeScript(filename) {
  const file = path.resolve(filename);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const localRequire = specifier => {
    if (specifier === "server-only") return {};
    if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return require(specifier);
    const base = specifier.startsWith("@/") ? path.resolve(specifier.slice(2)) : path.resolve(path.dirname(file), specifier);
    const target = [base, base + ".ts", base + ".tsx", path.join(base, "index.ts")]
      .find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    if (!target) throw new Error(`Unresolved ${specifier} in ${file}`);
    return loadTypeScript(target);
  };
  const { outputText } = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  });
  new Function("require", "module", "exports", outputText)(localRequire, module, module.exports);
  return module.exports;
}
