import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";
import { loadTypeScript } from "./load-typescript.mjs";

const require = createRequire(import.meta.url);
const source = ts.transpileModule(fs.readFileSync("components/voice/voice-feedback.tsx", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
}).outputText;

// Exercise the component's real event handlers without requesting a microphone
// or sending recordings. Browser permissions and audio encoding need device QA.
function harness(t) {
  const slots = [], cleanups = [];
  t.after(() => cleanups.forEach(cleanup => cleanup?.()));
  let cursor = 0, first = true, deadline, recorder, signal, resolveUpload, body;
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
      body = options.body;
      resolveUpload = (result = { ok: true, status: 201, json: async () => ({ ok: true, id: "00000000-0000-4000-8000-000000000001" }) }) => resolve(result);
      signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    }),
  };
  for (const [key, value] of Object.entries(globals)) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    t.after(() => descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key]);
  }
  const module = { exports: {} };
  new Function("require", "module", "exports", source)(name => {
    if (name === "react") return hooks;
    if (name === "@/components/ui/icon") return loadTypeScript("components/ui/icon.tsx");
    return require(name);
  }, module, module.exports);
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
  // Decorative SVG children do not contribute to a control's text label.
  const text = node => typeof node === "string" ? node : Array.isArray(node) ? node.map(text).join("") : text(node?.props?.children ?? "");
  const button = name => find(props => typeof props.onClick === "function" && (text(props.children).trim() === name || props.className === name));
  const click = name => button(name).props.onClick();
  const prepare = async () => {
    click("vf-trigger");
    await click("Start recording");
    click("Stop recording");
    find(props => props.placeholder === "Your name").props.onChange({ target: { value: "Test Client" } });
    find(props => props.type === "checkbox").props.onChange({ target: { checked: true } });
  };
  return { click, button, find, prepare, deadline: () => deadline(), recorder: () => recorder, signal: () => signal, body: () => body, resolve: result => resolveUpload(result) };
}

test("closing an upload aborts it and a late completion cannot reopen feedback", async t => {
  const ui = harness(t);
  await ui.prepare();
  const sending = ui.click("Send privately");
  ui.click("vf-close");
  assert.equal(ui.signal().aborted, true);
  ui.resolve();
  await sending;
  assert.equal(ui.find(props => props.className === "vf-panel"), undefined);
});

test("a timed-out upload restores review with an honest delivery warning", async t => {
  const ui = harness(t);
  await ui.prepare();
  const sending = ui.click("Send privately");
  ui.deadline();
  await sending;
  assert.match(ui.find(props => props.role === "alert").props.children, /taking too long to confirm/);
  assert.ok(ui.button("Send privately"));
});

test("recorder errors cannot turn failed audio into a reviewable note", async t => {
  const ui = harness(t);
  ui.click("vf-trigger");
  await ui.click("Start recording");
  ui.recorder().onerror();
  assert.ok(ui.find(props => props.children === "Start recording"));
  assert.equal(ui.button("Send privately"), undefined);
});

test("the honeypot submits the current DOM value, including autofill without a change event", async t => {
  const ui = harness(t);
  await ui.prepare();
  ui.find(props => props.name === "website").props.ref.current = { value: "filled-by-bot.invalid" };
  const sending = ui.click("Send privately");
  assert.equal(ui.body().get("website"), "filled-by-bot.invalid");
  ui.resolve();
  await sending;
});

test("uncertain server delivery keeps the recording and displays the reconciliation warning", async t => {
  const ui = harness(t);
  await ui.prepare();
  const sending = ui.click("Send privately");
  const message = "Delivery could not be confirmed. Your note may have reached us; please check with our team before resending.";
  ui.resolve({ ok: false, json: async () => ({ error: message }) });
  await sending;
  assert.equal(ui.find(props => props.role === "alert").props.children, message);
  assert.ok(ui.button("Send privately"));
  assert.ok(ui.find(props => props.className === "vf-audio"));
});

test("an HTML or malformed success response cannot discard the recording", async t => {
  const ui = harness(t);
  await ui.prepare();
  const sending = ui.click("Send privately");
  ui.resolve({ ok: true, status: 200, json: async () => { throw new Error("HTML response"); } });
  await sending;
  assert.match(ui.find(props => props.role === "alert").props.children, /could not be confirmed/);
  assert.ok(ui.find(props => props.className === "vf-audio"));
});

test("a confirmed saved note clears its preview and shows private-delivery success", async t => {
  const ui = harness(t);
  await ui.prepare();
  const sending = ui.click("Send privately");
  ui.resolve(); await sending;
  assert.match(ui.find(props => props.className === "vf-message").props.children, /sent privately/);
  assert.equal(ui.find(props => props.className === "vf-audio"), undefined);
});
