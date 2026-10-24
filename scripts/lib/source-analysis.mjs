import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

export function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

/** Inspect literal imports, including lazy scene imports, without executing app code. */
export function sourceGraph() {
  const files = ["app", "components", "lib"].flatMap(walk).filter(file => /\.[jt]sx?$/.test(file));
  const graph = new Map();
  const resolve = (file, specifier) => {
    const base = specifier.startsWith("@/") ? specifier.slice(2)
      : specifier.startsWith(".") ? path.normalize(path.join(path.dirname(file), specifier)) : null;
    if (!base) return null;
    return [base, ...[".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx"].map(ext => base + ext)]
      .find(candidate => files.includes(candidate)) ?? null;
  };
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    const imports = [];
    const visit = node => {
      let specifier, typeOnly = false;
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
        specifier = node.moduleSpecifier.text;
        const clause = node.importClause;
        typeOnly = !!(node.isTypeOnly || clause?.isTypeOnly ||
          (clause && !clause.name && ts.isNamedImports(clause.namedBindings) &&
            clause.namedBindings.elements.every(element => element.isTypeOnly)));
      } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        specifier = node.arguments[0]?.text;
      }
      if (specifier) imports.push({ specifier, target: resolve(file, specifier), typeOnly });
      ts.forEachChild(node, visit);
    };
    visit(ast);
    graph.set(file, { imports, client: /^['"]use client['"];/.test(source),
      server: imports.some(entry => entry.specifier === "server-only") });
  }
  return graph;
}
