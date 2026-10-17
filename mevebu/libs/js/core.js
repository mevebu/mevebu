// Shared utilities for every mevebu tool: DOM building, storage, clipboard,
// crypto helpers, the bench controls, the modal, and the command palette.
//
// The interface is Tailwind, and this file is where the shared pieces of it live,
// so a control is written once instead of in 186 tools. Every class string below
// is a plain Tailwind utility list, and DESIGN.md section 3 pins the values they
// resolve to. A tool passes only the delta it needs: `class` is merged onto the
// helper's own class list, never substituted for it.

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

export function icon(name, cls = "size-[18px] flex-none") {
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
  let node = $("#toast");
  if (!node) {
    node = el("div", {
      id: "toast",
      class: "pointer-events-none fixed bottom-6 left-1/2 z-90 -translate-x-1/2 translate-y-3 rounded-r1 bg-ink px-4 py-2.5 text-sm font-semibold text-void opacity-0 transition-[opacity,translate] duration-150 data-[on]:translate-y-0 data-[on]:opacity-100",
      role: "status",
      "aria-live": "polite",
    });
    document.body.append(node);
  }
  node.textContent = message;
  node.dataset.on = "";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => delete node.dataset.on, 1800);
}

// ---------- modal ----------

let lastFocus = null;

/* One panel shape for the whole app: an optional sigil head, body copy, then an
   action row that follows the same rule as a tool card (primary last, rightmost).
   A close button is always in the corner, and Escape or a backdrop click does the
   same thing. This is the only surface in the app that carries a shadow, because
   it is the only one that genuinely floats above the page. */
const MODAL_BODY = "grid gap-2.5 [&_p]:text-pretty [&_p]:text-ink-2";

/** The head every modal opens with: a sigil for what the dialog is about, then its title. */
export function modalHead(iconName, title) {
  return el(
    "div",
    { class: "flex items-center gap-3 pe-10" },
    el("span", { class: "grid size-11 flex-none place-items-center rounded-xl border border-orbit bg-jade-soft text-jade [&_svg]:size-[22px]" }, icon(iconName)),
    el("h2", { class: "text-xl font-bold tracking-[-0.02em]" }, title)
  );
}

export function modal({ label, body, actions = [], onOpen, onClose, panelClass } = {}) {
  lastFocus = document.activeElement;
  const veil = el("div", {
    class: "group fixed inset-0 z-80 grid place-items-center overflow-y-auto bg-[var(--scrim)] px-5 py-[clamp(20px,5vh,40px)] opacity-0 transition-opacity duration-200 data-[state=open]:opacity-100",
  });
  const panel = el(
    "div",
    {
      class:
        "relative grid gap-4 rounded-r3 border border-orbit bg-deck shadow-[var(--shadow)] transition-transform duration-200 ease-[var(--ease)] translate-y-3.5 scale-[0.97] group-data-[state=open]:translate-y-0 group-data-[state=open]:scale-100 " +
        (panelClass ?? "m-auto w-[min(480px,100%)] p-[clamp(22px,3vw,28px)]"),
      role: "dialog",
      "aria-modal": "true",
      "aria-label": label,
    },
    body ? el("div", { class: MODAL_BODY }, ...body) : null,
    actions.length ? el("div", { class: "mt-1 flex flex-wrap items-center justify-end gap-2" }, ...actions) : null
  );
  veil.append(panel);
  document.body.append(veil);
  document.body.style.overflow = "hidden";

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    delete veil.dataset.state;
    onClose?.();
    setTimeout(() => {
      veil.remove();
      document.body.style.overflow = "";
    }, 180);
    document.removeEventListener("keydown", onKey);
    if (lastFocus?.focus) lastFocus.focus();
  };

  const closeButton = el("button", {
    class: "absolute top-3 end-3 inline-flex size-9 cursor-pointer items-center justify-center rounded-r1 border border-transparent bg-transparent text-ink-3 transition-colors duration-150 hover:bg-deck-2 hover:text-ink",
    type: "button",
    "aria-label": "Close",
    onclick: () => close(),
  }, icon("x"));

  // The button is inside the panel, after its content, so it never lands in the
  // tab order ahead of the dialog's own controls.
  panel.append(closeButton);

  const onKey = (event) => {
    if (event.key === "Escape") close();
  };
  veil.addEventListener("mousedown", (event) => {
    if (event.target === veil) close();
  });
  document.addEventListener("keydown", onKey);

  requestAnimationFrame(() => {
    veil.dataset.state = "open";
  });
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
    class: "h-[var(--ctl)] min-w-0 flex-1 border-0 bg-transparent text-md outline-none placeholder:text-ink-3",
    type: "search",
    placeholder: "Search tools",
    "aria-label": "Search tools",
    autocomplete: "off",
    spellcheck: "false",
  });
  const list = el("ul", { class: "mt-1.5 max-h-[min(60vh,360px)] overflow-y-auto px-2 pb-2", role: "listbox" });
  const count = el("p", { class: "m-0 px-[18px] pt-2 text-2xs text-ink-3" });
  const footer = el(
    "p",
    { class: "m-0 flex flex-wrap items-center gap-2.5 border-t border-orbit px-[18px] py-2.5 text-2xs text-ink-3" },
    "↑↓ navigate  ",
    el("kbd", { class: "rounded-[5px] border border-orbit-hard px-[7px] py-px font-sans text-2xs leading-[1.45] text-ink-3" }, "↵"),
    " open  ",
    el("kbd", { class: "rounded-[5px] border border-orbit-hard px-[7px] py-px font-sans text-2xs leading-[1.45] text-ink-3" }, "esc"),
    " close"
  );

  const body = [
    el(
      "div",
      { class: "flex items-center gap-3 border-b border-orbit py-4 pe-12 ps-[18px]" },
      icon("search", "size-[26px] flex-none text-ink-3"),
      input
    ),
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
            class:
              "group flex w-full cursor-pointer items-center gap-3 rounded-r1 border-0 bg-transparent px-3 py-2.5 text-start text-ink transition-colors duration-150 data-[on]:bg-jade-soft",
            role: "option",
            dataset: { href: toolHref(tool) },
            "aria-selected": String(i === index),
            onmousemove: () => setIndex(i),
            onclick: () => pick(i),
          },
          el("span", { class: "grid size-8 flex-none place-items-center rounded-lg bg-deck-2 text-jade [&_svg]:size-4" }, icon(tool.icon)),
          el("span", { class: "grid min-w-0 flex-1 gap-px" },
            el("span", { class: "text-sm font-semibold tracking-[-0.01em] group-data-[on]:text-jade" }, tool.name),
            el("span", { class: "overflow-hidden text-2xs text-ellipsis whitespace-nowrap text-ink-2" }, tool.note)),
          el("span", { class: "whitespace-nowrap text-2xs text-ink-3" }, category?.name ?? "")
        );
      })
    );
    if (!current.length) {
      list.append(el("li", { class: "p-[18px] text-sm text-ink-3" }, "No tool matches “", query, "”."));
    }
    count.textContent = q
      ? `${current.length} of ${tools.length} tools`
      : `${tools.length} tools`;
  }

  function setIndex(next) {
    if (!current.length) return;
    index = (next + current.length) % current.length;
    for (const item of list.children) delete item.dataset.on;
    const active = list.children[index];
    if (active) {
      active.dataset.on = "";
      active.scrollIntoView({ block: "nearest" });
    }
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
    panelClass: "w-[min(640px,100%)] overflow-hidden p-0",
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

/** Two column bench: controls on the left, the result on the right.
 *  Above 60rem the controls pin under the header, so a long result can be read
 *  and scrolled without the controls leaving the screen. The cap keeps the
 *  bottom of a tall form reachable instead of pinning it out of view.
 *  The negative margin plus the matching padding give the focus halo room to
 *  paint: a scroll container clips its children's ink, and the fields sit flush
 *  with the column edges, so without the 4px gutter every ring loses its sides.
 *  The pair cancels out, so the fields keep their width and stay on the anchor line. */
export function bench(side, main) {
  const sideColumn =
    "min-w-0 min-[60rem]:sticky min-[60rem]:top-[var(--stick)] min-[60rem]:max-h-[var(--stick-max)] min-[60rem]:overflow-y-auto min-[60rem]:overscroll-contain min-[60rem]:-mx-1 min-[60rem]:px-1";
  return el(
    "div",
    { class: "grid items-start gap-5 min-[60rem]:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] min-[60rem]:gap-6" },
    el("div", { class: sideColumn }, side),
    el("div", { class: "min-w-0" }, main)
  );
}

/** Single centred stage for tools whose whole interface is one object. */
export function stage(...nodes) {
  return el("div", { class: "mx-auto grid max-w-[560px] justify-items-center gap-4 text-center max-[45rem]:justify-items-stretch max-[45rem]:text-start" }, ...nodes);
}

export function stack(...nodes) {
  return el("div", { class: "grid content-start gap-4" }, ...nodes);
}

/** Row of controls. Pass anything; it sits in the row. */
export function row(...nodes) {
  return el("div", { class: "flex min-w-0 flex-wrap items-center gap-2" }, ...nodes);
}

/** Right-aligned actions block. Use this for primary action buttons. */
export function actions(...nodes) {
  return el("div", { class: "flex flex-wrap items-center justify-end gap-2" }, ...nodes);
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
  const band = "border-orbit bg-deck-2 px-[var(--card-pad)] py-[var(--band-pad)] max-[60rem]:px-[18px]";
  const headNode = el("div", { class: `flex flex-wrap items-center gap-2 border-b ${band}`, hidden: !head }, head);
  const bodyNode = el("div", { class: "flex-1 p-[var(--card-pad)] max-[60rem]:p-[18px]" }, body);
  const footNode = el("div", { class: `flex flex-wrap items-center justify-end gap-2 border-t ${band}`, hidden: !foot }, foot);
  const node = el("div", { class: "flex flex-col overflow-clip rounded-r2 border border-orbit bg-deck" }, headNode, bodyNode, footNode);
  return { node, head: headNode, body: bodyNode, foot: footNode };
}

// ---------- controls ----------

/** A panel field: label on top, the control, optional hint underneath.
 *  Pass a `state` ("error" | "good" | "warning") for status colours. The state is
 *  drawn as an outline, so it never fights the border or the focus ring. */
const HINT_TONE = { error: "text-danger", good: "text-jade", warning: "text-ink" };
const EDGE_TONE = {
  error: "outline-2 -outline-offset-2 outline-danger",
  good: "outline-2 -outline-offset-2 outline-jade",
  warning: "outline-2 -outline-offset-2 outline-star",
};

export function panel(labelText, control, hint, state) {
  if (state && EDGE_TONE[state] && control?.classList) control.classList.add(...EDGE_TONE[state].split(" "));
  return el(
    "label",
    { class: "grid min-w-0 content-start gap-1.5" },
    labelText ? el("span", { class: "text-sm font-semibold text-ink-2" }, labelText) : null,
    control,
    hint ? el("span", { class: `text-2xs ${HINT_TONE[state] ?? "text-ink-3"}` }, hint) : null
  );
}

/* One field skin. You type on the raised deck surface, the same height as every
   button beside it, and the focus ring is jade. Only the properties that never
   change live in the base; width, padding and font size belong to the variant,
   because two utilities for one property in the same layer resolve by sheet
   order, not by the order they are written in the class list. */
const FIELD =
  "min-w-0 rounded-r1 border border-orbit bg-deck text-ink transition-[border-color,box-shadow] duration-150 placeholder:text-ink-3 hover:border-orbit-hard focus:border-jade focus:outline-none focus:ring-3 focus:ring-jade-soft";

/** Merge a tool's own class onto a helper's class list. */
function withExtra(base, extra) {
  return extra ? `${base} ${extra}` : base;
}

export function textInput({ mono, class: extra, ...attrs } = {}) {
  return el("input", {
    class: withExtra(`${FIELD} w-full min-h-[var(--ctl)] px-3 py-2.5 ${mono ? "font-mono text-sm" : "text-base"}`, extra),
    spellcheck: "false",
    autocomplete: "off",
    ...attrs,
  });
}

export function textArea({ class: extra, rows = 6, ...attrs } = {}) {
  return el("textarea", {
    class: withExtra(`${FIELD} w-full min-h-24 resize-y px-3 py-2.5 font-mono text-sm leading-normal`, extra),
    rows,
    spellcheck: "false",
    ...attrs,
  });
}

export function selectInput(options, { class: extra, ...attrs } = {}) {
  const node = el("select", {
    class: withExtra(
      `${FIELD} w-full min-h-[var(--ctl)] cursor-pointer py-2.5 ps-3 pe-9 appearance-none bg-no-repeat bg-[position:right_12px_center] bg-[length:14px] bg-[image:var(--caret)] text-base`,
      extra
    ),
    ...attrs,
  });
  for (const option of options) {
    const { value, label } = typeof option === "string" ? { value: option, label: option } : option;
    node.append(el("option", { value, selected: value === attrs.value }, label));
  }
  return node;
}

export function numberInput({ class: extra, ...attrs } = {}) {
  return el("input", {
    class: withExtra(`${FIELD} w-24 min-h-[var(--ctl)] px-3 py-2.5 text-base`, extra),
    type: "number",
    inputmode: "numeric",
    ...attrs,
  });
}

export function rangeInput({ class: extra, ...attrs } = {}) {
  return el("input", { class: withExtra("min-h-[var(--ctl)] w-full accent-[var(--jade)]", extra), type: "range", ...attrs });
}

const PICK =
  "h-[var(--ctl)] w-[52px] flex-none cursor-pointer rounded-r1 border border-orbit bg-deck p-0.5 hover:border-orbit-hard focus:border-jade focus:outline-none focus:ring-3 focus:ring-jade-soft";

export function colorInput({ class: extra, ...attrs } = {}) {
  return el("input", { class: withExtra(PICK, extra), type: "color", ...attrs });
}

export function fileInput({ class: extra, ...attrs } = {}) {
  return el("input", {
    class: withExtra(
      `${FIELD} w-full min-h-[var(--ctl)] p-1.5 text-sm [&::file-selector-button]:me-2.5 [&::file-selector-button]:cursor-pointer [&::file-selector-button]:rounded-r1 [&::file-selector-button]:border [&::file-selector-button]:border-orbit-hard [&::file-selector-button]:bg-deck-2 [&::file-selector-button]:px-2.5 [&::file-selector-button]:py-1 [&::file-selector-button]:text-2xs [&::file-selector-button]:font-semibold [&::file-selector-button]:text-ink`,
      extra
    ),
    type: "file",
    ...attrs,
  });
}

export function passwordInput({ class: extra, ...attrs } = {}) {
  return el("input", {
    class: withExtra(`${FIELD} w-full min-h-[var(--ctl)] px-3 py-2.5 font-mono text-sm`, extra),
    type: "password",
    autocomplete: "new-password",
    ...attrs,
  });
}

export function checkbox(labelText, attrs = {}) {
  const box = el("input", { class: "m-0 size-4 accent-[var(--jade)]", type: "checkbox", ...attrs });
  const node = el(
    "label",
    { class: "inline-flex min-h-[var(--ctl)] cursor-pointer items-center gap-2 rounded-r1 border border-orbit bg-deck py-2 ps-2.5 pe-3 text-sm transition-[border-color,background-color] duration-150 has-checked:border-jade has-checked:bg-jade-soft" },
    box,
    el("span", {}, labelText)
  );
  node.input = box;
  return node;
}

export function switchControl(labelText, attrs = {}) {
  const box = el("input", { class: "peer pointer-events-none absolute opacity-0", type: "checkbox", role: "switch", ...attrs });
  const track = el(
    "span",
    { class: "relative h-[22px] w-[38px] rounded-full bg-track transition-colors duration-150 peer-checked:bg-jade peer-checked:[&>span]:translate-x-4 peer-focus-visible:ring-3 peer-focus-visible:ring-jade-soft" },
    el("span", { class: "absolute top-0.5 left-0.5 size-[18px] rounded-full bg-deck shadow-[0_1px_2px_rgb(0_0_0/0.18)] transition-transform duration-150" })
  );
  const node = el("label", { class: "inline-flex min-h-[var(--ctl)] cursor-pointer items-center gap-2.5 select-none text-sm" }, box, track, el("span", {}, labelText));
  node.input = box;
  return node;
}

/* One button: one height, one padding, three weights. `fill` is the high
   emphasis action and the only button that carries the accent. There is no size
   modifier, because a tool that needs a smaller button needs fewer buttons.
   `tag: "a"` lets a link wear the same skin, so no tool hand writes the class. */
const BTN =
  "inline-flex min-h-[var(--ctl)] cursor-pointer items-center justify-center gap-2 rounded-r1 border text-sm font-semibold whitespace-nowrap no-underline transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45";
const BTN_KIND = {
  fill: "border-jade bg-jade px-4 text-on-jade hover:border-jade-deep hover:bg-jade-deep",
  plain: "border-orbit bg-deck px-4 text-ink hover:border-orbit-hard hover:bg-deck-2",
  quiet: "border-transparent bg-transparent px-2.5 text-ink-2 hover:bg-deck-2 hover:text-ink",
  danger: "border-danger bg-danger px-4 text-on-danger hover:border-danger-deep hover:bg-danger-deep",
};

export function button(labelText, { icon: iconName, kind = "plain", class: extra, tag = "button", ...rest } = {}) {
  return el(
    tag,
    { class: withExtra(`${BTN} ${BTN_KIND[kind] ?? BTN_KIND.plain}`, extra), ...(tag === "button" ? { type: "button" } : null), ...rest },
    iconName ? icon(iconName) : null,
    // An icon-only button skips the label span: an empty one still spends the
    // row's gap, which pushes the icon off centre.
    labelText ? el("span", {}, labelText) : null
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
const CHIP =
  "min-h-[var(--ctl)] cursor-pointer rounded-r1 border border-orbit bg-deck px-[13px] text-sm font-medium text-ink-2 transition-colors duration-150 hover:border-orbit-hard hover:text-ink data-[on]:border-jade data-[on]:bg-jade-soft data-[on]:text-ink";

export function chipRow(items, { value, onChange, label } = {}) {
  const wrap = el("div", { class: "flex flex-wrap gap-1.5", role: "group", "aria-label": label || "Options" });
  let current = value;
  const paint = () => {
    for (const chip of wrap.children) {
      const item = items.find((entry) => entry.label === chip.textContent);
      const on = item?.value === current;
      if (on) chip.dataset.on = "";
      else delete chip.dataset.on;
      chip.setAttribute("aria-pressed", String(on));
    }
  };
  for (const item of items) {
    wrap.append(el("button", { class: CHIP, type: "button", onclick: () => wrap.select(item.value) }, item.label));
  }
  wrap.select = (next) => {
    current = next;
    paint();
    onChange?.(current);
  };
  paint();
  return wrap;
}

/**
 * Independent toggles. Returns the wrapper with `.values()` reading the boxes.
 * `columns: 2` lays them out on an even grid, so a set of related boxes lines up
 * instead of ragging across the row.
 */
export function toggleRow(items, { columns } = {}) {
  const boxes = new Map();
  const wrap = el("div", { class: columns === 2 ? "grid grid-cols-2 gap-1.5" : "flex flex-wrap gap-1.5" });
  for (const item of items) {
    const node = checkbox(item.label, { checked: item.checked !== false });
    boxes.set(item.value, node.input);
    wrap.append(node);
  }
  wrap.values = () => [...boxes].filter(([, box]) => box.checked).map(([value]) => value);
  return wrap;
}

// ---------- readouts ----------

/* The recessed half of the surface pair, so a result never reads as an input. */
const OUT =
  "m-0 max-h-[340px] w-full overflow-auto rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3 font-mono text-sm leading-normal whitespace-pre-wrap [overflow-wrap:anywhere]";

export function output({ value = "", rows = 6, tag = "pre", readonly = true } = {}) {
  const node = tag === "pre"
    ? el("pre", { class: `${OUT} [&:empty]:border-dashed [&:empty]:bg-transparent` }, value)
    : el("textarea", { class: `${OUT} resize-y`, readonly, rows, value });
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
const NOTE_KIND = {
  error: "border-s-danger text-danger",
  warn: "border-s-star font-medium text-ink",
  good: "border-s-jade text-jade",
};

export function notice(kind = "note") {
  const node = el("p", { class: `border-s-[3px] ps-2 text-sm ${NOTE_KIND[kind] ?? "border-transparent text-ink-3"}`, role: kind === "error" ? "alert" : null });
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
    { class: "grid justify-items-center gap-2.5 rounded-r2 border border-dashed border-orbit-hard bg-deck-2 px-4 py-[clamp(28px,6vw,56px)] text-center text-ink-3 [&_p]:max-w-[34ch]" },
    iconName ? icon(iconName, "size-[26px] flex-none") : null,
    el("p", {}, text)
  );
}

// ---------- version ----------

// Kept in one place. The CLI reads the same value from package.json.
export const VERSION = "1.7.3";
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

/** One JSON GET with its own timeout. Answers null on any failure. */
async function getJson(url, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    // The registry answers `/latest` with `max-age=300`, so a cached reply would
    // keep reporting the version from before a publish for five minutes. A
    // version check is worthless when it is stale, so it never reads the cache.
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function npmVersion(timeout) {
  const data = await getJson(`https://registry.npmjs.org/${PACKAGE_NAME}/latest`, timeout);
  return data?.version ?? null;
}

async function githubVersion(timeout) {
  const data = await getJson(`https://api.github.com/repos/${REPO_SLUG}/releases/latest`, timeout);
  return (data?.tag_name ?? "").replace(/^v/, "") || null;
}

/**
 * Reads the newest published version. npm answers first and the GitHub release
 * is the fallback, since either one can be unreachable on its own. Resolves to
 * `{ latest, current, outdated }`, or null when neither answered, so the app
 * never blocks on the network and the modal can offer a retry.
 */
export async function checkForUpdate({ timeout = 5000 } = {}) {
  const latest = (await npmVersion(timeout)) ?? (await githubVersion(timeout));
  if (!latest) return null;
  return { latest, current: VERSION, outdated: compareVersions(latest, VERSION) > 0 };
}

/** The command that updates an existing global install. */
export function updateCommand() {
  return `npm install -g ${PACKAGE_NAME}`;
}

/** The GitHub page listing what changed, for one version or for every release. */
export function releaseUrl(version) {
  const base = `https://github.com/${REPO_SLUG}/releases`;
  return version ? `${base}/tag/v${version}` : base;
}

export { hasIcon };