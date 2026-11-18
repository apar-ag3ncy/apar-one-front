import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import postcss from "postcss";
import { loadTypeScript } from "./load-typescript.mjs";

const { IconSprite } = loadTypeScript("components/ui/icon-sprite.tsx");
const { UiIcon } = loadTypeScript("components/ui/icon.tsx");

test("every UI icon resolves to a unique server-rendered vector without a font or network request", () => {
  const source = ts.createSourceFile("icon.tsx", fs.readFileSync("components/ui/icon.tsx", "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const names = source.statements.find(node => ts.isTypeAliasDeclaration(node) && node.name.text === "IconName").type.types.map(node => node.literal.text);
  const sprite = renderToStaticMarkup(createElement(IconSprite));
  const ids = [...sprite.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, names.length);
  for (const name of names) {
    const icon = renderToStaticMarkup(createElement(UiIcon, { name }));
    const reference = icon.match(/href="#([^"]+)"/)[1];
    assert.ok(ids.includes(reference), `${name} must not render an empty icon`);
    assert.match(icon, /aria-hidden="true"/);
    assert.match(icon, /focusable="false"/);
    assert.match(icon, /stroke="currentColor"/);
    assert.match(icon, /stroke-width="1.5"/);
    assert.doesNotMatch(icon, /https?:|<img|<text/);
  }
});

const iconGlyph = /[\p{Extended_Pictographic}\p{Regional_Indicator}\u2190-\u21ff\u27f0-\u27ff\u2900-\u297f\u2b00-\u2bff\uFE0F\u20E3]/u;
const hasIconGlyph = text => iconGlyph.test(text.replace(/[©®™](?!\uFE0F)/gu, ""));
const filesIn = root => fs.readdirSync(root, { recursive: true }).map(file => `${root}/${file}`);

test("renderable website text and CSS use vectors instead of emoji or text-arrow icons", () => {
  const violations = [];
  const inspect = (file, text) => { if (hasIconGlyph(text)) violations.push(`${file}: ${JSON.stringify(text.trim().slice(0, 100))}`); };
  for (const file of ["app", "components", "lib"].flatMap(filesIn).filter(file => /\.(?:tsx?|jsx?)$/.test(file))) {
    // Transpiling decodes JSX entities and JavaScript escapes. Comments are
    // ignored, so documentation arrows do not get mistaken for rendered icons.
    const javascript = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      fileName: file,
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    }).outputText;
    const ast = ts.createSourceFile(file + ".js", javascript, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    function visit(node) {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) inspect(file, node.text);
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
  for (const file of ["app", "styles"].flatMap(filesIn).filter(file => file.endsWith(".css"))) {
    postcss.parse(fs.readFileSync(file, "utf8"), { from: file }).walkDecls(declaration => {
      const decoded = declaration.value.replace(/\\([0-9a-f]{1,6})\s?/gi, (_, hex) => {
        const point = Number.parseInt(hex, 16);
        return point <= 0x10ffff ? String.fromCodePoint(point) : "";
      });
      inspect(file, decoded);
    });
  }
  assert.deepEqual(violations, [], "Use UiIcon or an SVG path for interface symbols.");
});
