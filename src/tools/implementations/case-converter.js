// Case Converter — 10+ letter cases
import { el, icon, toast, copyText } from "../../lib/dom.js";

function words(s) {
  return s
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_\-.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}
const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();

const CASES = {
  "UPPERCASE": (w) => w.join(" ").toUpperCase(),
  "lowercase": (w) => w.join(" ").toLowerCase(),
  "Title Case": (w) => w.map(cap).join(" "),
  "Sentence case": (w) => { const s = w.join(" ").toLowerCase(); return s.charAt(0).toUpperCase() + s.slice(1); },
  camelCase: (w) => w[0]?.toLowerCase() + w.slice(1).map(cap).join(""),
  PascalCase: (w) => w.map(cap).join(""),
  snake_case: (w) => w.map((x) => x.toLowerCase()).join("_"),
  "kebab-case": (w) => w.map((x) => x.toLowerCase()).join("-"),
  "CONSTANT_CASE": (w) => w.map((x) => x.toUpperCase()).join("_"),
  "Train-Case": (w) => w.map(cap).join("-"),
  "aLtErNaTiNg": (w) => w.join(" ").split("").map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase())).join(""),
};

export function mount(container) {
  const src = el("textarea", { class: "tinput ttextarea", rows: 4, spellcheck: "false", placeholder: "Type or paste anything…" });
  src.value = "hello world this mevebu";
  const out = el("pre", { class: "tout tout--block wrap" }, "");
  let active = "camelCase";

  const list = el("div", { class: "caselist" });
  Object.entries(CASES).forEach(([name, fn]) => {
    const b = el("button", {
      class: "tchip" + (name === active ? " is-active" : ""), type: "button",
      onclick: () => {
        active = name;
        $$(".tchip", list).forEach((n) => n.classList.remove("is-active"));
        b.classList.add("is-active");
        run();
      },
    }, name);
    list.append(b);
  });
  function run() {
    const w = words(src.value);
    out.textContent = w.length ? CASES[active](w) : "";
  }
  src.addEventListener("input", run);
  const copy = el("button", { class: "btn btn--accent", type: "button" }, icon("copy"), "Copy result");
  copy.onclick = async () => out.textContent && ((await copyText(out.textContent)) && toast("Copied ✓"));

  container.append(el("div", { class: "tstack" },
    el("label", { class: "tfield" }, el("span", { class: "tfield__label" }, "Input"), src),
    list,
    el("label", { class: "tfield" }, el("span", { class: "tfield__label" }, `${active} →`), out),
    copy));
  run();
  return {};
}
const $$ = (sel, root) => Array.from(root.querySelectorAll(sel));
export default { mount };
