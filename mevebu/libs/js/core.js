// Shared utilities for every mevebu tool: DOM building, storage, clipboard,
// crypto helpers, the bench controls, the modal, and the command palette.
// Every class this file emits starts with mvb-.

import { svg, hasIcon } from "./icons.js";
import { CATEGORIES, TOOLS, toolHref, getCategory } from "./registry.js";

// ---------- DOM ----------

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/**
 * el("div", { class, onclick, value, ... }, child, child)
 * `class` becomes the class list, `on*` becomes a listener, `value` and
 * `checked` become live properties (attributes do not fill inputs), the rest
 * are attributes. Children may be nodes, strings, arrays, or null.
 */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "dataset") Object.assign(node.dataset, value);
    else if (key === "value" && "value" in node) node.value = value;
    else if (key === "checked" && "checked" in node) node.checked = Boolean(value);
    else if (key === "disabled" && "disabled" in node) node.disabled = Boolean(value);
    else if (key.startsWith("on") && typeof value === "function")
      node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value === true) node.setAttribute(key, "");
    else node.setAttribute(key, String(value));
  }
  add(node, children);
  return node;
}

function add(parent, children) {
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false || child === true) continue;
    parent.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
}

export function clear(node) {
  node.replaceChildren();
  return node;
}

export function icon(name, cls = "mvb-ico") {
  return svg(name, cls);
}

export function missingIcon(name) {
  console.warn(`[mevebu] icon "${name}" is not vendored. Run npm run icons.`);
  return null;
}

// ---------- storage ----------

const FAV_KEY = "mevebu.favorites";
const THEME_KEY = "mevebu.theme";
const PIN_KEY = "mevebu.pins.";

function readJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

export function getFavorites() {
  const value = readJSON(FAV_KEY, []);
  return new Set(Array.isArray(value) ? value : []);
}

export function isFavorite(id) {
  return getFavorites().has(id);
}

export function toggleFavorite(id) {
  const set = getFavorites();
  if (set.has(id)) set.delete(id);
  else set.add(id);
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify([...set]));
  } catch {
    /* private mode, the toggle just does not persist */
  }
  return set.has(id);
}

export function readPin(id, fallback = null) {
  return readJSON(PIN_KEY + id, fallback);
}

export function writePin(id, value) {
  try {
    localStorage.setItem(PIN_KEY + id, JSON.stringify(value));
  } catch {
    /* private mode */
  }
}

export function getTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* private mode */
  }
}

// ---------- clipboard, download, toast ----------

export async function copyText(text) {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = el("textarea", { style: "position:fixed;top:0;left:0;opacity:0" });
      area.value = text;
      document.body.append(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function download(filename, data, mime = "text/plain") {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = el("a", { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

let toastTimer;

export function toast(message) {
  let node = $("#mvb-toast");
  if (!node) {
    node = el("div", { id: "mvb-toast", class: "mvb-toast", role: "status", "aria-live": "polite" });
    document.body.append(node);
  }
  node.textContent = message;
  node.classList.add("mvb-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove("mvb-on"), 1800);
}

// ---------- modal ----------

let lastFocus = null;

/**
 * Opens a modal built from `body` nodes. Returns a close function.
 * Escape and backdrop clicks close it. Focus moves in and back out.
 */
export function modal({ label, body, actions = [], onOpen, onClose, veilClass } = {}) {
  lastFocus = document.activeElement;
  const veil = el("div", { class: "mvb-veil" + (veilClass ? ` ${veilClass}` : "") });
  const panel = el(
    "div",
    { class: "mvb-modal", role: "dialog", "aria-modal": "true", "aria-label": label },
    el("div", { class: "mvb-modal__body" }, ...body),
    actions.length ? el("div", { class: "mvb-modal__actions" }, ...actions) : null
  );
  veil.append(panel);
  document.body.append(veil);
  document.body.style.overflow = "hidden";

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    veil.classList.add("mvb-off");
    onClose?.();
    setTimeout(() => {
      veil.remove();
      document.body.style.overflow = "";
    }, 180);
    document.removeEventListener("keydown", onKey);
    if (lastFocus?.focus) lastFocus.focus();
  };

  const onKey = (event) => {
    if (event.key === "Escape") close();
  };
  veil.addEventListener("mousedown", (event) => {
    if (event.target === veil) close();
  });
  document.addEventListener("keydown", onKey);

  requestAnimationFrame(() => veil.classList.add("mvb-open"));
  onOpen?.({ close, panel });
  return close;
}

// ---------- command palette ----------

/**
 * Opens a live-search command palette over the registry. Arrow keys move the
 * highlight, Enter opens, Esc closes. Returns the close function.
 */
export function openPalette({ onPick } = {}) {
  const tools = TOOLS.map((tool) => ({
    id: tool.id,
    name: tool.name,
    note: tool.note,
    icon: tool.icon,
    category: tool.category,
    haystack: `${tool.name} ${tool.note} ${tool.keywords ?? ""}`.toLowerCase(),
  }));

  const input = el("input", {
    class: "mvb-pal__in",
    type: "search",
    placeholder: "Search tools",
    "aria-label": "Search tools",
    autocomplete: "off",
    spellcheck: "false",
  });
  const list = el("ul", { class: "mvb-pal__list", role: "listbox" });
  const count = el("p", { class: "mvb-pal__count" });
  const footer = el(
    "p",
    { class: "mvb-pal__foot" },
    "↑↓ navigate  ",
    el("kbd", { class: "mvb-pal__key" }, "↵"),
    " open  ",
    el("kbd", { class: "mvb-pal__key" }, "esc"),
    " close"
  );

  const body = [
    el("div", { class: "mvb-pal__head" }, icon("search", "mvb-ico mvb-ico--lg mvb-pal__icon"), input),
    count,
    list,
    footer,
  ];

  let current = [];
  let index = 0;

  function paint(query) {
    const q = query.trim().toLowerCase();
    current = q
      ? tools.filter((tool) => tool.haystack.includes(q))
      : tools.slice();
    index = 0;
    list.replaceChildren(
      ...current.map((tool, i) => {
        const category = getCategory(tool.category);
        return el(
          "li",
          {
            class: "mvb-pal__item" + (i === index ? " mvb-on" : ""),
            role: "option",
            dataset: { href: toolHref(tool) },
            "aria-selected": String(i === index),
            onmousemove: () => setIndex(i),
            onclick: () => pick(i),
          },
          el("span", { class: "mvb-pal__sigil" }, icon(tool.icon)),
          el("span", { class: "mvb-pal__text" },
            el("span", { class: "mvb-pal__name" }, tool.name),
            el("span", { class: "mvb-pal__note" }, tool.note)),
          el("span", { class: "mvb-pal__cat" }, category?.name ?? "")
        );
      })
    );
    if (!current.length) {
      list.append(el("li", { class: "mvb-pal__empty" }, "No tool matches “", query, "”."));
    }
    count.textContent = q
      ? `${current.length} of ${tools.length} tools`
      : `${tools.length} tools`;
  }

  function setIndex(next) {
    if (!current.length) return;
    index = (next + current.length) % current.length;
    for (const item of list.children) item.classList.remove("mvb-on");
    list.children[index]?.classList.add("mvb-on");
    list.children[index]?.scrollIntoView({ block: "nearest" });
  }

  function pick(at) {
    const tool = current[at];
    if (!tool) return;
    close();
    onPick ? onPick(tool) : (location.hash = toolHref(tool));
  }

  const close = modal({
    label: "Search tools",
    body,
    onOpen: ({ close: doClose, panel: modalPanel }) => {
      input.focus();
      input.addEventListener("input", () => paint(input.value));
      input.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown") { event.preventDefault(); setIndex(index + 1); }
        else if (event.key === "ArrowUp") { event.preventDefault(); setIndex(index - 1); }
        else if (event.key === "Enter") { event.preventDefault(); pick(index); }
      });
      void modalPanel;
      void doClose;
    },
    veilClass: "mvb-veil--pal",
  });

  paint("");
  return close;
}

// ---------- crypto ----------

/** Uniform integer in [0, max). Falls back to Math.random only without Web Crypto. */
export function randomInt(max) {
  if (max <= 0) return 0;
  if (!globalThis.crypto?.getRandomValues) return Math.floor(Math.random() * max);
  const limit = Math.floor(0xffffffff / max) * max;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % max;
}

export function shuffle(list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function debounce(fn, ms = 120) {
  let id;
  return (...args) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), ms);
  };
}

// ---------- bench layout ----------

/** Two column bench: controls on the left, the result on the right. */
export function bench(side, main) {
  return el("div", { class: "mvb-bench" }, el("div", { class: "mvb-bench__side" }, side), el("div", { class: "mvb-bench__main" }, main));
}

/** Single centred stage for tools whose whole interface is one object. */
export function stage(...nodes) {
  return el("div", { class: "mvb-stage" }, ...nodes);
}

export function stack(...nodes) {
  return el("div", { class: "mvb-stack" }, ...nodes);
}

/**
 * Row of controls. Pass anything; it sits in the row. Use `<.mvb-actions>` to
 * mark "thumbs-up submit" slots that should sit on the right of a tool form.
 */
export function row(...nodes) {
  return el("div", { class: "mvb-row" }, ...nodes);
}

/** Right-aligned actions block. Use this for primary action buttons. */
export function actions(...nodes) {
  return el("div", { class: "mvb-actions" }, ...nodes);
}

// ---------- tool card ----------

/**
 * A tool card with a head, a body and a foot. The action row goes in the foot as
 * a rule, so buttons sit on the card's bottom edge instead of floating mid
 * column. Put it in the head instead when the card is tall and the actions
 * should stay reachable without scrolling to the end.
 *
 *   const card = toolcard({ head: ..., body: ..., foot: actions(copy, generate) });
 *   slot.append(card.node);
 */
export function toolcard({ head, body, foot } = {}) {
  const headNode = el("div", { class: "mvb-toolcard__head", hidden: !head }, head);
  const bodyNode = el("div", { class: "mvb-toolcard__body" }, body);
  const footNode = el("div", { class: "mvb-toolcard__foot", hidden: !foot }, foot);
  const node = el("div", { class: "mvb-toolcard" }, headNode, bodyNode, footNode);
  return { node, head: headNode, body: bodyNode, foot: footNode };
}

// ---------- controls ----------

/**
 * A panel field: label on top, the control, optional hint underneath.
 * Pass a `state` ("error" | "good" | "warning") for status colours.
 */
export function panel(labelText, control, hint, state) {
  return el(
    "label",
    { class: "mvb-field" + (state ? ` mvb-field--${state}` : "") },
    labelText ? el("span", { class: "mvb-field__label" }, labelText) : null,
    control,
    hint ? el("span", { class: "mvb-field__hint" }, hint) : null
  );
}

export function textInput(attrs = {}) {
  return el("input", { class: "mvb-in", spellcheck: "false", autocomplete: "off", ...attrs });
}

export function textArea(attrs = {}) {
  return el("textarea", { class: "mvb-in mvb-in--area", rows: 6, spellcheck: "false", ...attrs });
}

export function selectInput(options, attrs = {}) {
  const node = el("select", { class: "mvb-in mvb-in--select", ...attrs });
  for (const option of options) {
    const { value, label } = typeof option === "string" ? { value: option, label: option } : option;
    node.append(el("option", { value, selected: value === attrs.value }, label));
  }
  return node;
}

export function numberInput(attrs = {}) {
  return el("input", { class: "mvb-in mvb-in--num", type: "number", inputmode: "numeric", ...attrs });
}

export function rangeInput(attrs = {}) {
  return el("input", { class: "mvb-range", type: "range", ...attrs });
}

export function colorInput(attrs = {}) {
  return el("input", { class: "mvb-pick", type: "color", ...attrs });
}

export function fileInput(attrs = {}) {
  return el("input", { class: "mvb-in mvb-in--file", type: "file", ...attrs });
}

export function passwordInput(attrs = {}) {
  return el("input", { class: "mvb-in mvb-in--mono", type: "password", autocomplete: "new-password", ...attrs });
}

export function checkbox(labelText, attrs = {}) {
  const box = el("input", { class: "mvb-check__box", type: "checkbox", ...attrs });
  const node = el("label", { class: "mvb-check" }, box, el("span", {}, labelText));
  node.input = box;
  return node;
}

export function switchControl(labelText, attrs = {}) {
  const box = el("input", { class: "mvb-switch__box", type: "checkbox", role: "switch", ...attrs });
  const track = el("span", { class: "mvb-switch__track" }, el("span", { class: "mvb-switch__thumb" }));
  const node = el("label", { class: "mvb-switch" }, box, track, el("span", { class: "mvb-switch__label" }, labelText));
  node.input = box;
  return node;
}

/** Primary button. `kind: "fill"` is the high-emphasis action. */
export function button(labelText, { icon: iconName, kind = "plain", size, ...rest } = {}) {
  const cls = ["mvb-btn", `mvb-btn--${kind}`];
  if (size) cls.push(`mvb-btn--${size}`);
  return el(
    "button",
    { class: cls.join(" "), type: "button", ...rest },
    iconName ? icon(iconName) : null,
    el("span", {}, labelText)
  );
}

export function copyButton(getText, labelText = "Copy", kind = "plain") {
  return button(labelText, {
    icon: "copy",
    kind,
    onclick: async () => {
      const text = getText();
      if (!text) return toast("Nothing to copy yet");
      toast((await copyText(text)) ? "Copied" : "Copy failed");
    },
  });
}

export function downloadButton(getData, filename, labelText = "Download", mime = "text/plain") {
  return button(labelText, {
    icon: "download",
    onclick: () => {
      const data = typeof getData === "function" ? getData() : getData;
      if (!data) return toast("Nothing to save yet");
      download(filename, data, mime);
    },
  });
}

/**
 * Single choice chips. `items` is [{ value, label }]. Returns the wrapper with
 * a `.select(value)` method so the tool can read the current value.
 */
export function chipRow(items, { value, onChange, label, size = "sm" } = {}) {
  const wrap = el("div", { class: `mvb-chips mvb-chips--${size}`, role: "group", "aria-label": label || "Options" });
  let current = value;
  const paint = () => {
    for (const chip of wrap.children) {
      const item = items.find((entry) => entry.label === chip.textContent);
      const on = item?.value === current;
      chip.classList.toggle("mvb-on", on);
      chip.setAttribute("aria-pressed", String(on));
    }
  };
  for (const item of items) {
    wrap.append(el(
      "button",
      { class: "mvb-chip", type: "button", onclick: () => wrap.select(item.value) },
      item.label
    ));
  }
  wrap.select = (next) => {
    current = next;
    paint();
    onChange?.(current);
  };
  paint();
  return wrap;
}

/** Independent toggles. Returns the wrapper with `.values()` reading the boxes. */
export function toggleRow(items) {
  const boxes = new Map();
  const wrap = el("div", { class: "mvb-chips" });
  for (const item of items) {
    const node = checkbox(item.label, { checked: item.checked !== false });
    boxes.set(item.value, node.input);
    wrap.append(node);
  }
  wrap.values = () => [...boxes].filter(([, box]) => box.checked).map(([value]) => value);
  return wrap;
}

// ---------- readouts ----------

export function output({ value = "", rows = 6, tag = "pre", readonly = true } = {}) {
  const node = tag === "pre"
    ? el("pre", { class: "mvb-out" }, value)
    : el("textarea", { class: "mvb-out", readonly, rows, value });
  if (readonly) node.setAttribute("readonly", "");
  // A textarea ignores textContent once its value has been assigned, so the
  // readout has to write through `.value`.
  node.write = (text) => {
    if ("value" in node) node.value = text;
    else node.textContent = text;
  };
  return node;
}

/** A short line under a control. `kind` is one of error, warn, note, good. */
export function notice(kind = "note") {
  const node = el("p", { class: `mvb-note mvb-note--${kind}`, role: kind === "error" ? "alert" : null });
  node.write = (text) => {
    node.textContent = text || "";
    node.hidden = !text;
  };
  return node;
}

/** Shown when a tool has nothing to display yet. */
export function blank(iconName, text) {
  return el(
    "div",
    { class: "mvb-blank" },
    iconName ? icon(iconName, "mvb-ico mvb-ico--lg") : null,
    el("p", {}, text)
  );
}

// ---------- version ----------

// Kept in one place. The CLI reads the same value from package.json.
export const VERSION = "1.0.0";
export const PACKAGE_NAME = "mevebu";
export const REPO_SLUG = "mevebu/mevebu";

/** Compare two X.Y.Z strings. Returns 1, 0, or -1 for a > b, a == b, a < b. */
export function compareVersions(a, b) {
  const left = String(a).split(".").map((part) => parseInt(part, 10) || 0);
  const right = String(b).split(".").map((part) => parseInt(part, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((left[i] ?? 0) > (right[i] ?? 0)) return 1;
    if ((left[i] ?? 0) < (right[i] ?? 0)) return -1;
  }
  return 0;
}

/**
 * Asks the npm registry for the latest published version. Fails silently when
 * offline, so the app never blocks on the network. Resolves to
 * `{ latest, current, outdated }` or null when the check did not complete.
 */
export async function checkForUpdate({ timeout = 5000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`https://registry.npmjs.org/${PACKAGE_NAME}/latest`, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    clearTimeout(timer);
    if (!response.ok) return null;
    const data = await response.json();
    const latest = data?.version;
    if (!latest) return null;
    return { latest, current: VERSION, outdated: compareVersions(latest, VERSION) > 0 };
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/** The command that updates an existing global install. */
export function updateCommand() {
  return `npm install -g ${PACKAGE_NAME}`;
}

export { hasIcon };