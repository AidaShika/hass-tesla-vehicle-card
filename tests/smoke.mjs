// Smoke tests for tesla-vehicle-card.js — plain Node, no dependencies, no real DOM.
// Run: node tests/smoke.mjs
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
const NEW_FILE = join(here, "..", "tesla-vehicle-card.js");
// The original v1.6.6 file from the author's private audit folder (parity checks
// are skipped when it is not present, e.g. in a standalone clone of this repo).
const OLD_FILE = join(here, "..", "..", "..", "..", "..", "tesla-model-y-card-audit", "model-y-card.js");

// ---------- Minimal DOM stubs ----------
class ShadowStub {
  constructor() {
    this.innerHTML = "";
  }
  addEventListener() {}
  querySelector() {
    return null;
  }
  querySelectorAll() {
    return [];
  }
  getElementById() {
    return null;
  }
}
class HTMLElementStub {
  attachShadow() {
    this.shadowRoot = new ShadowStub();
    return this.shadowRoot;
  }
  toggleAttribute(name, force) {
    this._attrs = this._attrs || {};
    if (force) this._attrs[name] = true;
    else delete this._attrs[name];
  }
  setAttribute() {}
  removeAttribute() {}
  dispatchEvent() {
    return true;
  }
}

let lastDefined = {};
function loadCard(file) {
  const code = readFileSync(file, "utf8");
  let CardClass = null;
  const defined = {};
  const sandbox = {
    console,
    HTMLElement: HTMLElementStub,
    customElements: {
      define(name, cls) {
        defined[name] = cls;
        CardClass = cls;
      },
      get(name) {
        return defined[name];
      },
    },
    document: {
      createElement(tag) {
        const C = defined[tag];
        return C ? new C() : new HTMLElementStub();
      },
    },
    window: {},
    navigator: { language: "en-US" },
    CustomEvent: class {
      constructor(type, opts) {
        this.type = type;
        Object.assign(this, opts || {});
      }
    },
    setTimeout,
    clearTimeout,
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: file });
  assert.ok(CardClass, `card class registered from ${file}`);
  lastDefined = defined;
  return CardClass;
}

// ---------- Fixtures ----------
const PREFIX = "my_model_y";
function makeHass(lang, overrides = {}) {
  const st = (state, attributes = {}) => ({
    state,
    attributes,
    last_updated: "2026-10-24T00:00:00.000Z",
  });
  const states = {
    [`binary_sensor.${PREFIX}_status`]: st("off"), // asleep
    [`lock.${PREFIX}_lock`]: st("locked"),
    [`sensor.${PREFIX}_battery_level`]: st("99"),
    [`sensor.${PREFIX}_battery_range`]: st("429"),
    [`sensor.${PREFIX}_odometer`]: st("12345", { unit_of_measurement: "km" }),
    [`update.${PREFIX}_update`]: st("off", { installed_version: "2026.32.7" }),
    [`sensor.${PREFIX}_charging`]: st("disconnected"),
    [`binary_sensor.${PREFIX}_charge_cable`]: st("off"),
    [`cover.${PREFIX}_charge_port_door`]: st("closed"),
    [`sensor.${PREFIX}_inside_temperature`]: st("22"),
    [`sensor.${PREFIX}_outside_temperature`]: st("17.5"),
    [`cover.${PREFIX}_frunk`]: st("closed"),
    [`cover.${PREFIX}_trunk`]: st("closed"),
    [`switch.${PREFIX}_sentry_mode`]: st("off"),
    [`number.${PREFIX}_charge_limit`]: st("90", { min: 50, max: 100, step: 1 }),
    [`climate.${PREFIX}_climate`]: st("off", {
      temperature: 22,
      min_temp: 15,
      max_temp: 28,
      preset_modes: [],
    }),
    [`button.${PREFIX}_wake`]: st("unknown"),
    [`button.${PREFIX}_flash_lights`]: st("unknown"),
    [`button.${PREFIX}_honk_horn`]: st("unknown"),
    ...overrides,
  };
  return {
    states,
    language: lang,
    locale: { language: lang },
    callService() {},
  };
}

const BASE_CONFIG = {
  vehicle: PREFIX,
  name: "My Model Y",
  paint: "stealth_grey",
  wheels: 19,
  interior: "black",
};

// Strip the <style> block (it contains non-rendered CSS comments) before text assertions.
const visible = (html) => html.replace(/<style>[\s\S]*?<\/style>/g, "");

function render(CardClass, config, hass) {
  const card = new CardClass();
  card.setConfig({ ...BASE_CONFIG, ...config });
  card.hass = hass;
  return { card, html: card.shadowRoot.innerHTML };
}

function renderPanel(CardClass, config, hass, panel) {
  const r = render(CardClass, config, hass);
  r.card._panel = panel;
  r.card._render();
  r.html = r.card.shadowRoot.innerHTML;
  return r;
}

let passed = 0;
async function check(name, fn) {
  await fn();
  passed += 1;
  console.log(`  ok - ${name}`);
}

const NewCard = loadCard(NEW_FILE);
const NEW_DEFINED = lastDefined; // (later loadCard calls for the old file replace lastDefined)

// ---------- 1. Chinese rendering (auto -> hass language zh) ----------
await check("zh render contains Chinese status text", () => {
  const { html } = render(NewCard, {}, makeHass("zh-Hans"));
  const v = visible(html);
  assert.ok(v.includes("休眠中"), "asleep badge in zh");
  assert.ok(v.includes("已上锁"), "locked badge in zh");
  assert.ok(v.includes("哨兵"), "sentry chip in zh");
  assert.ok(v.includes("车内"), "interior temp label in zh");
  assert.ok(v.includes("后备箱"), "trunk button in zh");
  assert.ok(v.includes("99") && v.includes("429"), "battery / range values");
  assert.ok(v.includes("Model Y 焕新版 · 星空灰"), "zh subtitle with paint label");
});

// ---------- 2. English rendering (explicit language: "en" wins over zh hass) ----------
await check("en render contains English and no Chinese headline strings", () => {
  const { html } = render(NewCard, { language: "en" }, makeHass("zh-Hans"));
  const v = visible(html);
  assert.ok(v.includes("Asleep"), "asleep badge in en");
  assert.ok(v.includes("Locked"), "locked badge in en");
  assert.ok(v.includes("Sentry"), "sentry chip in en");
  assert.ok(v.includes("Interior"), "interior temp label in en");
  assert.ok(v.includes("Trunk"), "trunk button in en");
  assert.ok(v.includes("Model Y Refresh · Stealth Grey"), "en subtitle with paint label");
  for (const zh of ["休眠中", "已上锁", "哨兵", "后备箱", "车内", "空调", "充电上限"]) {
    assert.ok(!v.includes(zh), `en render must not contain zh string: ${zh}`);
  }
});

// ---------- 3. English via auto (hass language en) ----------
await check("auto language follows hass (en)", () => {
  const { html } = render(NewCard, {}, makeHass("en-US"));
  assert.ok(visible(html).includes("Asleep"));
});

// ---------- 4. show_status decoupling ----------
await check("no min_height + no show_status -> no status row (legacy)", () => {
  const { html } = render(NewCard, {}, makeHass("zh-Hans"));
  assert.ok(!html.includes('class="status"'), "status row hidden");
});
await check("show_status: true without min_height -> status row shown", () => {
  const { html } = render(NewCard, { show_status: true }, makeHass("zh-Hans"));
  assert.ok(html.includes('class="status"'), "status row shown");
  const v = visible(html);
  assert.ok(v.includes("门窗"), "status cell: doors & windows");
  assert.ok(v.includes("充电上限"), "status cell: charge limit");
});
await check("min_height without show_status -> status row hidden, sizing kept (opt-in default)", () => {
  const { html } = render(NewCard, { min_height: 876 }, makeHass("zh-Hans"));
  assert.ok(!html.includes('class="status"'), "status row hidden by default");
  assert.ok(html.includes("min-height:876px"), "min_height still applied");
});
await check("show_status: true with min_height -> status row shown, sizing kept", () => {
  const { html } = render(NewCard, { min_height: 876, show_status: true }, makeHass("zh-Hans"));
  assert.ok(html.includes('class="status"'), "status row shown when opted in");
  assert.ok(html.includes("min-height:876px"), "min_height still applied");
});

// ---------- 5. _imageUrl (default model = modely_juniper, unchanged) ----------
await check("_imageUrl builds Tesla configurator URL from paint/wheels/interior", () => {
  const { card } = render(NewCard, {}, makeHass("zh-Hans"));
  const url = card._imageUrl("STUD_3QTR");
  const decoded = decodeURIComponent(url);
  assert.ok(decoded.includes("$PN01"), "stealth grey paint code");
  assert.ok(decoded.includes("$WY19P"), "19in wheel code");
  assert.ok(decoded.includes("$IPB10"), "black interior code");
  assert.ok(decoded.includes("$MTY46"), "Model Y trim code");
  assert.ok(url.includes("view=STUD_3QTR"), "view parameter");
  assert.ok(url.includes("model=my"), "model parameter");
});

// ---------- 6. Visible-content parity with the original v1.6.6 ----------
// Phase 2 changed some rendered details on purpose; the comparison below
// normalizes exactly those documented deltas and nothing else:
//   - <style> contents (new CSS for armed state / info row / TPMS, icon CSS)
//   - icon <svg> markup (icons redrawn as original stroke-style artwork)
//   - the data-freshness span (new phase-2 element, class "fresh")
//   - the car-image fallback text (reworded in phase 2)
//   - insignificant whitespace between tags (new conditional template lines)
// Everything else — all visible text, values, buttons, badges — must match.
const normalizeParity = (html) =>
  html
    .replace(/<style>[\s\S]*?<\/style>/g, "")
    .replace(/<span class="fresh">[^<]*<\/span>/g, "")
    .replace(/<div class="car-fallback">[^<]*<\/div>/g, "")
    .replace(/<svg[\s\S]*?<\/svg>/g, "<svg/>")
    .replace(/>\s+</g, "><");
await check("zh render matches v1.6.6 visible content (default config, documented deltas normalized)", () => {
  if (!existsSync(OLD_FILE)) return console.log("    (skipped: v1.6.6 reference file not present)");
  const OldCard = loadCard(OLD_FILE);
  const oldHtml = render(OldCard, {}, makeHass("zh-Hans")).html;
  const newHtml = render(NewCard, {}, makeHass("zh-Hans")).html;
  assert.equal(normalizeParity(newHtml), normalizeParity(oldHtml), "visible content differs from v1.6.6 beyond the documented phase-2 deltas");
});
await check("min_height: status row hidden in both v1.6.6 (dead code) and v1.0.0 (opt-in default)", () => {
  if (!existsSync(OLD_FILE)) return console.log("    (skipped: v1.6.6 reference file not present)");
  const OldCard = loadCard(OLD_FILE);
  const oldHtml = render(OldCard, { min_height: 876 }, makeHass("zh-Hans")).html;
  const newHtml = render(NewCard, { min_height: 876 }, makeHass("zh-Hans")).html;
  assert.ok(!oldHtml.includes('class="status"'), "v1.6.6: status row is dead code");
  assert.ok(!newHtml.includes('class="status"'), "v1.0.0: status row hidden unless show_status: true");
  assert.ok(newHtml.includes("min-height:876px"), "v1.0.0: min_height still applied");
});

// ---------- 7. Icons: original stroke-style rendering ----------
await check("icons render as stroke line style; old MDI paths are gone", () => {
  const src = readFileSync(NEW_FILE, "utf8");
  assert.ok(!src.includes("M12 17a2 2 0 0 0 2-2"), "old MDI lock path fragment must not remain");
  const { html } = render(NewCard, {}, makeHass("zh-Hans"));
  assert.ok(html.includes('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"'), "svg uses stroke rendering");
  const m = html.match(/<svg[^>]*><path[^>]*? d="([^"]*)"/);
  assert.ok(m && !m[1].startsWith("M12 17"), "first icon (lock) is not the old filled path");
});

// ---------- 8. Multi-model image URLs (codes per the verified 2026-10-24 matrix) ----------
await check("modely_legacy URL uses $MDLY/$MTY09 and verified legacy codes", () => {
  const { card } = render(NewCard, { model: "modely_legacy", paint: "pearl_white", wheels: 20, interior: "white" }, makeHass("zh-Hans"));
  const decoded = decodeURIComponent(card._imageUrl("STUD_3QTR"));
  for (const code of ["$MDLY", "$MTY09", "$PPSW", "$WY20P", "$INPW0"]) {
    assert.ok(decoded.includes(code), `legacy URL contains ${code}`);
  }
  assert.ok(decoded.includes("model=my"), "legacy Y still uses compositor model=my");
});
await check("image_options escape hatch is used verbatim and ignores paint/wheels/interior/trim", () => {
  const raw = "$MDLY,$MTY09,$PPSW,$WY19B,$INPW0";
  const { card } = render(NewCard, { image_options: raw, paint: "ultra_red" }, makeHass("zh-Hans"));
  const decoded = decodeURIComponent(card._imageUrl("STUD_3QTR"));
  assert.ok(decoded.includes(`options=${raw}`), "raw options string in URL");
  assert.ok(!decoded.includes("$PR01"), "paint config ignored when image_options is set");
});
await check("models_refresh climate background falls back to STUD_3QTR (no STUD_SEAT)", () => {
  const { html } = renderPanel(
    NewCard,
    { model: "models_refresh", paint: "solid_black", wheels: 19, interior: "black" },
    makeHass("zh-Hans"),
    "climate"
  );
  assert.ok(html.includes('class="cabin"'), "climate panel rendered");
  assert.ok(!html.includes("STUD_SEAT"), "S/X must never request STUD_SEAT (compositor returns 412)");
  assert.ok(html.includes("model=ms"), "compositor model parameter is ms");
});

// ---------- 9. Units come from the entities, not hardcoded ----------
await check("range and charge rate use unit_of_measurement (mi / mi-per-hour)", () => {
  const hass = makeHass("zh-Hans", {
    [`sensor.${PREFIX}_battery_range`]: { state: "429", attributes: { unit_of_measurement: "mi" }, last_updated: "2026-10-24T00:00:00.000Z" },
    [`sensor.${PREFIX}_charging`]: { state: "charging", attributes: {}, last_updated: "2026-10-24T00:00:00.000Z" },
    [`binary_sensor.${PREFIX}_charge_cable`]: { state: "on", attributes: {}, last_updated: "2026-10-24T00:00:00.000Z" },
    [`sensor.${PREFIX}_charger_power`]: { state: "11", attributes: {}, last_updated: "2026-10-24T00:00:00.000Z" },
    [`sensor.${PREFIX}_charge_rate`]: { state: "58", attributes: { unit_of_measurement: "mi/h" }, last_updated: "2026-10-24T00:00:00.000Z" },
    [`sensor.${PREFIX}_charge_energy_added`]: { state: "10", attributes: {}, last_updated: "2026-10-24T00:00:00.000Z" },
    [`sensor.${PREFIX}_time_to_full_charge`]: { state: "1.5", attributes: {}, last_updated: "2026-10-24T00:00:00.000Z" },
    [`switch.${PREFIX}_charge`]: { state: "on", attributes: {}, last_updated: "2026-10-24T00:00:00.000Z" },
    [`number.${PREFIX}_charge_current`]: { state: "32", attributes: { min: 6, max: 48, step: 1 }, last_updated: "2026-10-24T00:00:00.000Z" },
  });
  const { html } = render(NewCard, {}, hass);
  assert.ok(visible(html).includes("429 mi"), "range shown in miles");
  assert.ok(!visible(html).includes("429 km"), "range not hardcoded to km");
  const panel = renderPanel(NewCard, {}, hass, "charge");
  assert.ok(panel.html.includes("58 mi/h"), "charge rate shown with entity unit");
  assert.ok(!panel.html.includes("58 km/h"), "charge rate not hardcoded to km/h");
});

// ---------- 10. Command feedback: success/failure toasts ----------
await check("failed service call shows an error toast, success shows the success toast", async () => {
  const hass = makeHass("zh-Hans");
  const { card } = render(NewCard, {}, hass);
  const toastEl = { textContent: "", classList: { add() {}, remove() {} } };
  card.shadowRoot.getElementById = () => toastEl;
  hass.callService = () => Promise.reject(new Error("Vehicle is offline"));
  await card._call("button", "press", "flash");
  assert.ok(toastEl.textContent.includes("指令执行失败"), "failure toast shown");
  assert.ok(toastEl.textContent.includes("Vehicle is offline"), "failure reason included");
  assert.ok(!toastEl.textContent.includes("指令已执行"), "no success toast on failure");
  hass.callService = () => Promise.resolve();
  await card._call("button", "press", "flash");
  assert.equal(toastEl.textContent, "指令已执行", "success toast after the call resolves");
});

// ---------- 11. Buttons for missing entities are not rendered ----------
await check("missing entities hide their action buttons", () => {
  const hass = makeHass("zh-Hans");
  delete hass.states[`lock.${PREFIX}_lock`];
  delete hass.states[`button.${PREFIX}_flash_lights`];
  delete hass.states[`button.${PREFIX}_honk_horn`];
  const { html } = render(NewCard, {}, hass);
  assert.ok(!html.includes('data-act="lock"'), "lock button hidden without lock entity");
  const more = renderPanel(NewCard, {}, hass, "more");
  assert.ok(!more.html.includes('data-act="flash"'), "flash hidden without its button entity");
  assert.ok(!more.html.includes('data-act="horn"'), "horn hidden without its button entity");
  assert.ok(more.html.includes('data-act="frunk"'), "frunk still shown (entity exists)");
});

// ---------- 12. Two-tap confirmation ----------
await check("two-tap confirmation: first tap arms only, second tap executes", () => {
  const hass = makeHass("zh-Hans", {
    // car awake, so the wake-up gate in _cmd does not interfere with this test
    [`binary_sensor.${PREFIX}_status`]: { state: "on", attributes: {}, last_updated: "2026-10-24T00:00:00.000Z" },
  });
  const calls = [];
  hass.callService = (d, s, data) => {
    calls.push([d, s, data]);
    return Promise.resolve();
  };
  const { card } = render(NewCard, {}, hass);
  const lbl = { textContent: "鸣笛" };
  const el = {
    dataset: { act: "horn" },
    classList: {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      contains(c) { return this._set.has(c); },
    },
    querySelector: (sel) => (sel === ".lbl" ? lbl : null),
  };
  el.closest = () => el;
  card._onClick({ target: el });
  assert.equal(calls.length, 0, "first tap must not call the service");
  assert.ok(el.classList.contains("armed"), "button enters the armed state");
  assert.equal(lbl.textContent, "确认？", "label switches to the confirm prompt");
  card._onClick({ target: el });
  assert.equal(calls.length, 1, "second tap executes");
  assert.equal(calls[0][0], "button", "horn service domain");
  assert.ok(!el.classList.contains("armed"), "armed state cleared after execution");
  assert.equal(lbl.textContent, "鸣笛", "label restored after execution");
});

// ---------- 13. Tyre pressure section ----------
await check("tyre pressure section renders in the more panel; missing corners show --", () => {
  const st = (state, attributes = {}) => ({ state, attributes, last_updated: "2026-10-24T00:00:00.000Z" });
  const hass = makeHass("zh-Hans", {
    [`sensor.${PREFIX}_tire_pressure_front_left`]: st("2.9", { unit_of_measurement: "bar" }),
    [`sensor.${PREFIX}_tire_pressure_front_right`]: st("2.8", { unit_of_measurement: "bar" }),
    [`sensor.${PREFIX}_tire_pressure_rear_left`]: st("3.0", { unit_of_measurement: "bar" }),
    // rear right deliberately absent
  });
  const { html } = renderPanel(NewCard, {}, hass, "more");
  assert.ok(visible(html).includes("胎压"), "TPMS section header");
  assert.ok(html.includes("左前") && html.includes("2.9 bar"), "front-left value with unit");
  assert.ok(html.includes("右后") && html.includes("--"), "missing corner shows --");
  const empty = renderPanel(NewCard, {}, makeHass("zh-Hans"), "more");
  assert.ok(!visible(empty.html).includes("胎压"), "no TPMS section when all four sensors are missing");
  assert.ok(!empty.html.includes('class="tpms"'), "no TPMS markup when all four sensors are missing");
});

// ---------- 14. Location / navigation info row ----------
await check("navigation row shows destination, remaining distance and ETA", () => {
  const st = (state, attributes = {}) => ({ state, attributes, last_updated: "2026-10-24T00:00:00.000Z" });
  const hass = makeHass("zh-Hans", {
    [`sensor.${PREFIX}_active_route_destination`]: st("Shibuya City"),
    [`sensor.${PREFIX}_active_route_distance_to_arrival`]: st("12.4", { unit_of_measurement: "km" }),
    [`sensor.${PREFIX}_active_route_time_to_arrival`]: st("25"),
  });
  const { html } = render(NewCard, {}, hass);
  const v = visible(html);
  assert.ok(v.includes("🧭"), "navigation marker");
  assert.ok(v.includes("Shibuya City"), "destination name");
  assert.ok(v.includes("12.4 km"), "remaining distance with unit");
  assert.ok(v.includes("约 25 分钟"), "ETA in zh");
});
await check("location row shows 📍 + place when not navigating; absent without tracker/destination", () => {
  const st = (state, attributes = {}) => ({ state, attributes, last_updated: "2026-10-24T00:00:00.000Z" });
  const hass = makeHass("zh-Hans", { [`device_tracker.${PREFIX}`]: st("home") });
  const { html } = render(NewCard, {}, hass);
  assert.ok(visible(html).includes("📍"), "location marker");
  assert.ok(visible(html).includes("家"), "home shown as 家 in zh");
  const plain = render(NewCard, {}, makeHass("zh-Hans"));
  assert.ok(!plain.html.includes('class="inforow"'), "no info row without tracker or destination");
});

// ---------- 15. Data freshness ----------
await check("freshness text is derived from the status entity last_updated", () => {
  const hass = makeHass("zh-Hans", {
    [`binary_sensor.${PREFIX}_status`]: {
      state: "off",
      attributes: {},
      last_updated: new Date(Date.now() - 5 * 60000).toISOString(),
    },
  });
  const { html } = render(NewCard, {}, hass);
  assert.ok(visible(html).includes("5 分钟前更新"), "relative freshness in zh");
});

// ---------- 16. Visual editor ----------
await check("editor element is registered and fires config-changed with model-linked resets", () => {
  const EditorClass = NEW_DEFINED["tesla-vehicle-card-editor"];
  assert.ok(EditorClass, "tesla-vehicle-card-editor is registered");
  assert.ok(NEW_DEFINED["model-y-card"], "legacy alias model-y-card is registered");
  assert.strictEqual(NEW_DEFINED["model-y-card"], NEW_DEFINED["tesla-vehicle-card"], "legacy alias points at the same class");
  const { card } = render(NewCard, {}, makeHass("en-US"));
  const ed = card.getConfigElement();
  assert.ok(ed instanceof EditorClass, "getConfigElement returns the editor element");
  ed.setConfig({ vehicle: "my_car", model: "modely_juniper", paint: "quicksilver", wheels: 19, interior: "black" });
  let evt = null;
  ed.dispatchEvent = (e) => {
    evt = e;
    return true;
  };
  ed._setField("paint", "pearl_white");
  assert.ok(evt && evt.type === "config-changed", "config-changed dispatched");
  assert.equal(evt.detail.config.paint, "pearl_white", "edited field in the merged config");
  assert.equal(evt.detail.config.vehicle, "my_car", "other fields preserved");
  ed._setField("wheels", "20");
  assert.equal(evt.detail.config.wheels, 20, "wheels stored as a number");
  ed._setField("model", "modelx_refresh");
  assert.equal(evt.detail.config.paint, "pearl_white", "paint kept (valid for Model X)");
  assert.equal(evt.detail.config.wheels, 22, "wheels reset to the Model X default (only 22 offered)");
  assert.equal(evt.detail.config.interior, "black", "interior kept (valid for Model X)");
});

// ---------- 17. i18n key parity across zh / en / ja ----------
await check("all languages expose the identical string key set", () => {
  const src = readFileSync(NEW_FILE, "utf8");
  const start = src.indexOf("const STRINGS = {");
  const end = src.indexOf("\n};", start);
  assert.ok(start >= 0 && end > start, "STRINGS block found");
  const STRINGS = vm.runInNewContext(`(${src.slice(start + "const STRINGS = ".length, end + 2)})`);
  const paths = (obj, prefix = "") =>
    Object.entries(obj)
      .flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? paths(v, `${prefix}${k}.`) : [`${prefix}${k}`]))
      .sort();
  const zh = paths(STRINGS.zh);
  assert.deepEqual(paths(STRINGS.en), zh, "en keys match zh keys");
  assert.deepEqual(paths(STRINGS.ja), zh, "ja keys match zh keys");
});

// ---------- 18. Japanese rendering (auto -> hass language ja) ----------
await check("japanese labels render when hass language is ja", () => {
  const { html } = render(NewCard, {}, makeHass("ja-JP"));
  for (const s of ["ロック中", "空調", "トランク", "セントリー"]) {
    assert.ok(html.includes(s), `ja render contains ${s}`);
  }
});

// ---------- 19. Explicit language "ja" wins over hass language ----------
await check("explicit language ja wins over zh hass", () => {
  const { html } = render(NewCard, { language: "ja" }, makeHass("zh-Hans"));
  assert.ok(html.includes("ロック中"), "ja lock label rendered");
  assert.ok(!html.includes("已上锁"), "no zh lock label rendered");
});

// ---------- 20. Wake-up gate: asleep car is woken before the command ----------
await check("commands wake a sleeping car first, then execute once it is online", async () => {
  const hass = makeHass("zh-Hans");
  const { card } = render(NewCard, {}, hass);
  card._wakePollMs = 5;
  card._wakeTimeoutMs = 2000;
  const calls = [];
  hass.callService = (d, s, data) => {
    calls.push([d, s, data.entity_id]);
    if (data.entity_id === `button.${PREFIX}_wake`) {
      setTimeout(() => {
        hass.states[`binary_sensor.${PREFIX}_status`].state = "on";
      }, 15);
    }
    return Promise.resolve();
  };
  await card._cmd("switch", "turn_on", "sentry");
  assert.equal(calls.length, 2, "wake press + the command itself");
  assert.deepEqual(calls[0], ["button", "press", `button.${PREFIX}_wake`], "wake is pressed first");
  assert.deepEqual(calls[1], ["switch", "turn_on", `switch.${PREFIX}_sentry_mode`], "command runs after wake");
});

// ---------- 21. Wake-up timeout: command is not sent, timeout toast shown ----------
await check("wake-up timeout aborts the command with a timeout toast", async () => {
  const hass = makeHass("zh-Hans");
  const { card } = render(NewCard, {}, hass);
  card._wakePollMs = 5;
  card._wakeTimeoutMs = 60;
  const toastEl = { textContent: "", classList: { add() {}, remove() {} } };
  card.shadowRoot.getElementById = () => toastEl;
  const calls = [];
  hass.callService = (d, s, data) => {
    calls.push([d, s, data.entity_id]);
    return Promise.resolve();
  };
  await card._cmd("switch", "turn_on", "sentry");
  assert.equal(calls.length, 1, "only the wake press was attempted");
  assert.equal(calls[0][2], `button.${PREFIX}_wake`);
  assert.ok(toastEl.textContent.includes("车辆唤醒失败"), "wake timeout toast shown");
});

// ---------- 22. Retry once after waking when a command fails on a sleeping car ----------
await check("a failed command on a car that fell asleep is retried once after waking", async () => {
  const hass = makeHass("zh-Hans", {
    [`binary_sensor.${PREFIX}_status`]: { state: "on", attributes: {}, last_updated: "2026-10-24T00:00:00.000Z" },
  });
  const { card } = render(NewCard, {}, hass);
  card._wakePollMs = 5;
  card._wakeTimeoutMs = 2000;
  const toastEl = { textContent: "", classList: { add() {}, remove() {} } };
  card.shadowRoot.getElementById = () => toastEl;
  const calls = [];
  let failed = false;
  hass.callService = (d, s, data) => {
    calls.push([d, s, data.entity_id]);
    if (data.entity_id === `switch.${PREFIX}_sentry_mode` && !failed) {
      failed = true;
      hass.states[`binary_sensor.${PREFIX}_status`].state = "off"; // car fell asleep mid-command
      return Promise.reject(new Error("Vehicle is offline"));
    }
    if (data.entity_id === `button.${PREFIX}_wake`) {
      setTimeout(() => {
        hass.states[`binary_sensor.${PREFIX}_status`].state = "on";
      }, 15);
    }
    return Promise.resolve();
  };
  await card._cmd("switch", "turn_on", "sentry");
  assert.equal(calls.length, 3, "failed attempt + wake press + retry");
  assert.equal(toastEl.textContent, "指令已执行", "success toast after the retry");
});

// ---------- 23. Software update: installable badge, two-tap install, progress ----------
await check("software update badge installs via two-tap when supported, shows progress while installing", async () => {
  const stOn = (attrs) => ({ state: "on", attributes: attrs, last_updated: "2026-10-24T00:00:00.000Z" });
  const base = { installed_version: "2026.32.7", latest_version: "2026.38.1" };
  const ready = render(NewCard, {}, makeHass("zh-Hans", { [`update.${PREFIX}_update`]: stOn({ ...base, supported_features: 1 }) }));
  assert.ok(ready.html.includes('data-act="update_install"'), "installable badge is clickable");
  const unsupported = render(NewCard, {}, makeHass("zh-Hans", { [`update.${PREFIX}_update`]: stOn({ ...base, supported_features: 0 }) }));
  assert.ok(!unsupported.html.includes('data-act="update_install"'), "badge stays passive without install support");
  const installing = render(NewCard, {}, makeHass("zh-Hans", { [`update.${PREFIX}_update`]: stOn({ ...base, supported_features: 1, in_progress: true, update_percentage: 42 }) }));
  assert.ok(installing.html.includes("正在安装更新") && installing.html.includes("42%"), "progress shown while installing");
  assert.ok(!installing.html.includes('data-act="update_install"'), "no install action while installing");

  const hass = makeHass("zh-Hans", {
    [`binary_sensor.${PREFIX}_status`]: { state: "on", attributes: {}, last_updated: "2026-10-24T00:00:00.000Z" },
    [`update.${PREFIX}_update`]: stOn({ ...base, supported_features: 1 }),
  });
  const calls = [];
  hass.callService = (d, s, data) => {
    calls.push([d, s, data.entity_id]);
    return Promise.resolve();
  };
  const { card } = render(NewCard, {}, hass);
  const lbl = { textContent: "可更新 2026.38.1" };
  const el = {
    dataset: { act: "update_install" },
    classList: {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      contains(c) { return this._set.has(c); },
    },
    querySelector: (sel) => (sel === ".lbl" ? lbl : null),
  };
  el.closest = () => el;
  card._onClick({ target: el });
  assert.equal(calls.length, 0, "first tap only arms the install");
  card._onClick({ target: el });
  await new Promise((r) => setTimeout(r, 10));
  assert.deepEqual(calls, [["update", "install", `update.${PREFIX}_update`]], "second tap calls update.install");
});

console.log(`\nAll ${passed} smoke checks passed.`);
