import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = ts.transpileModule(fs.readFileSync("components/voice/voice-feedback.tsx", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
}).outputText;

// Exercise the component's real event handlers without requesting a microphone
// or sending recordings. Browser permissions and audio encoding need device QA.
function harness(t) {
  const slots = [], cleanups = [];
  t.after(() => cleanups.forEach(cleanup => cleanup?.()));
  let cursor = 0, first = true, deadline, recorder, signal, resolveUpload;
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (first) slots[index] = initial;
      return [slots[index], value => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
    },
    useRef(initial) { const index = cursor++; if (first) slots[index] = { current: initial }; return slots[index]; },
    useEffect(effect) { if (first) cleanups.push(effect()); },
  };
  class Recorder {
    static isTypeSupported() { return true; }
    state = "inactive";
    constructor() { recorder = this; }
    start() { this.state = "recording"; }
    stop() {
      this.state = "inactive";
      this.ondataavailable({ data: new Blob([new Uint8Array(300)]) });
      this.onstop();
    }
  }
  const globals = {
    MediaRecorder: Recorder,
    navigator: { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) } },
    window: { MediaRecorder: Recorder, setInterval: () => 1, clearInterval() {}, setTimeout: callback => { deadline = callback; return 1; }, clearTimeout() {} },
    fetch: (_url, options) => new Promise((resolve, reject) => {
      signal = options.signal;
      resolveUpload = () => resolve({ ok: true });
      signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    }),
  };
  for (const [key, value] of Object.entries(globals)) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    t.after(() => descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key]);
  }
  const module = { exports: {} };
  new Function("require", "module", "exports", source)(name => name === "react" ? hooks : require(name), module, module.exports);
  const render = () => {
    cursor = 0;
    const tree = module.exports.VoiceFeedback();
    first = false;
    const nodes = [];
    const walk = node => { if (!node || typeof node !== "object") return; if (Array.isArray(node)) return node.forEach(walk); nodes.push(node); walk(node.props?.children); };
    walk(tree);
    return nodes;
  };
  const find = predicate => render().find(node => predicate(node.props ?? {}));
  const click = name => find(props => props.children === name || props.className === name).props.onClick();
  const prepare = async () => {
    click("vf-trigger");
    await click("Start recording");
    click("Stop recording");
    find(props => props.placeholder === "Your name").props.onChange({ target: { value: "Test Client" } });
    find(props => props.type === "checkbox").props.onChange({ target: { checked: true } });
  };
  return { click, find, prepare, deadline: () => deadline(), recorder: () => recorder, signal: () => signal, resolve: () => resolveUpload() };
}

test("closing an upload aborts it and a late completion cannot reopen feedback", async t => {
  const ui = harness(t);
  await ui.prepare();
  const sending = ui.click("Send privately ↗");
  ui.click("vf-close");
  assert.equal(ui.signal().aborted, true);
  ui.resolve();
  await sending;
  assert.equal(ui.find(props => props.className === "vf-panel"), undefined);
});

test("a timed-out upload restores review with an honest delivery warning", async t => {
  const ui = harness(t);
  await ui.prepare();
  const sending = ui.click("Send privately ↗");
  ui.deadline();
  await sending;
  assert.match(ui.find(props => props.role === "alert").props.children, /taking too long to confirm/);
  assert.ok(ui.find(props => props.children === "Send privately ↗"));
});

test("recorder errors cannot turn failed audio into a reviewable note", async t => {
  const ui = harness(t);
  ui.click("vf-trigger");
  await ui.click("Start recording");
  ui.recorder().onerror();
  assert.ok(ui.find(props => props.children === "Start recording"));
  assert.equal(ui.find(props => props.children === "Send privately ↗"), undefined);
});
