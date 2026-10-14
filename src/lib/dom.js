// ============================================================
// mevebu — tiny DOM + storage helpers (no framework, native only)
// ============================================================

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === "class") node.className = v;
    else if (k === "dataset") Object.assign(node.dataset, v);
    else if (k.startsWith("on") && typeof v === "function")
      node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) node.setAttribute(k, "");
    else node.setAttribute(k, String(v));
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

// lucide placeholder element -> <i data-lucide="name" class="...">
export function icon(name, cls = "icon-sm") {
  const i = document.createElement("i");
  i.setAttribute("data-lucide", name);
  i.className = cls;
  return i;
}

// ---------- favorites (localStorage) ----------
const FAV_KEY = "mevebu.favorites";

export function getFavorites() {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

export function isFavorite(id) {
  return getFavorites().has(id);
}

export function toggleFavorite(id) {
  const set = getFavorites();
  if (set.has(id)) set.delete(id);
  else set.add(id);
  try { localStorage.setItem(FAV_KEY, JSON.stringify([...set])); } catch {}
  return set.has(id);
}

// ---------- clipboard with file:// fallback ----------
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback: hidden textarea + execCommand (works on file:// too)
    try {
      const ta = el("textarea", { style: "position:fixed;opacity:0;left:-9999px" });
      ta.value = text;
      document.body.append(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

// ---------- toast ----------
let toastTimer = null;
export function toast(msg) {
  let t = $("#toast");
  if (!t) {
    t = el("div", { id: "toast", className: "toast", role: "status" });
    document.body.append(t);
  }
  t.textContent = msg;
  t.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-show"), 1800);
}

// ---------- tool workspace UI kit (shared by implementations) ----------
export function field(labelText, controlNode, hint) {
  return el(
    "label",
    { class: "tfield" },
    el("span", { class: "tfield__label" }, labelText),
    controlNode,
    hint ? el("span", { class: "tfield__hint" }, hint) : null
  );
}

export function input(attrs = {}) {
  return el("input", { class: "tinput", ...attrs });
}

export function textarea(attrs = {}) {
  return el("textarea", { class: "tinput ttextarea", rows: 6, ...attrs });
}

export function select(attrs, options) {
  const s = el("select", { class: "tinput", ...attrs });
  options.forEach((o) => s.append(el("option", typeof o === "string" ? { value: o } : o, o.label ?? o.value)));
  return s;
}

export function btn(label, opts = {}, ...children) {
  const { variant = "ghost", icon: iconName, ...rest } = opts;
  return el("button", { class: `btn btn--${variant}`, type: "button", ...rest }, iconName ? icon(iconName) : null, label);
}

export function chipGroup(items, { value, onChange }) {
  const wrap = el("div", { class: "tchips" });
  items.forEach((it) => {
    const b = el("button", {
      type: "button",
      class: "tchip" + (it.value === value ? " is-active" : ""),
      onclick: () => {
        $$(".tchip", wrap).forEach((n) => n.classList.remove("is-active"));
        b.classList.add("is-active");
        onChange?.(it.value);
      },
    }, it.label);
    wrap.append(b);
  });
  return wrap;
}

export function copyField(labelText, readonlyInput, extraBtns = []) {
  const inp = el("input", { class: "tinput tout", readonly: true, value: "" });
  const row = el("div", { class: "tcopyrow" },
    field(labelText, inp),
    el("div", { class: "tcopyrow__btns" },
      btn("Copy", { variant: "ghost", icon: "copy", onclick: async () => { (await copyText(inp.value)) && toast("Copied ✓"); } }),
      ...extraBtns
    )
  );
  return { row, input: inp };
}

export function resultBox(text = "") {
  return el("pre", { class: "tout tout--block" }, text);
}

export function toolbar(...nodes) {
  return el("div", { class: "tbar" }, ...nodes);
}

export function stack(...nodes) {
  return el("div", { class: "tstack" }, ...nodes);
}

export function cryptoRandomInt(maxExclusive) {
  // uniform integer in [0, max) using Web Crypto
  const c = window.crypto || window.msCrypto;
  if (!c?.getRandomValues) return Math.floor(Math.random() * maxExclusive);
  const range = maxExclusive;
  const limit = Math.floor(0xffffffff / range) * range;
  const buf = new Uint32Array(1);
  let x;
  do { c.getRandomValues(buf); x = buf[0]; } while (x >= limit);
  return x % range;
}

export function cryptoShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = cryptoRandomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- misc ----------
export function download(filename, blobOrText, mime = "text/plain") {
  const blob = blobOrText instanceof Blob ? blobOrText : new Blob([blobOrText], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = el("a", { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function debounce(fn, ms = 150) {
  let id;
  return (...args) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), ms);
  };
}
