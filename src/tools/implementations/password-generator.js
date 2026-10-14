// Password Generator — crypto RNG + entropy meter
import { el, icon, toast, copyText } from "../../lib/dom.js";

const SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?/~",
};

export function mount(container) {
  const len = el("input", { class: "tslider", type: "range", min: "6", max: "64", value: "16" });
  const lenVal = el("span", { class: "tnote" }, "16");
  const boxes = {};
  const toggles = el("div", { class: "trow trow--wrap" });
  Object.entries({ lower: "a-z", upper: "A-Z", digits: "0-9", symbols: "!@#$" }).forEach(([k, label]) => {
    const cb = el("input", { type: "checkbox", checked: true });
    boxes[k] = cb;
    toggles.append(el("label", { class: "tcheck" }, cb, label));
  });

  const out = el("input", { class: "tinput code tout pwdout", readonly: true });
  const meter = el("div", { class: "meter" }, el("div", { class: "meter__fill" }));
  const meterLabel = el("span", { class: "tnote" }, "");

  function pool() {
    return Object.keys(SETS).filter((k) => boxes[k].checked).map((k) => SETS[k]).join("");
  }

  function randInt(n) {
    const b = new Uint32Array(1);
    do { crypto.getRandomValues(b); } while (b[0] >= Math.floor(0xffffffff / n) * n);
    return b[0] % n;
  }

  function gen() {
    const p = pool();
    if (!p) { out.value = ""; meterLabel.textContent = "Pick at least one character set."; return; }
    const n = parseInt(len.value, 10);
    let pwd = Array.from({ length: n }, () => p[randInt(p.length)]).join("");
    out.value = pwd;
    const entropy = n * Math.log2(p.length);
    const fill = meter.querySelector(".meter__fill");
    const pct = Math.min(100, (entropy / 128) * 100);
    fill.style.width = pct + "%";
    fill.className = "meter__fill " + (entropy < 50 ? "meter__fill--low" : entropy < 80 ? "meter__fill--mid" : "meter__fill--high");
    meterLabel.textContent = `~${Math.round(entropy)} bits · ${entropy < 50 ? "weak" : entropy < 80 ? "good" : "excellent"}`;
  }

  len.addEventListener("input", () => { lenVal.textContent = len.value; gen(); });
  Object.values(boxes).forEach((cb) => cb.addEventListener("change", gen));

  const genBtn = el("button", { class: "btn btn--accent", type: "button" }, icon("sparkles"), "Generate");
  const copyBtn = el("button", { class: "btn btn--ghost", type: "button" }, icon("copy"), "Copy");
  genBtn.onclick = gen;
  copyBtn.onclick = async () => out.value && ((await copyText(out.value)) && toast("Password copied ✓"));

  container.append(el("div", { class: "center-col tstack" },
    el("div", { class: "trow trow--wrap" },
      el("label", { class: "tfield grow" }, el("span", { class: "tfield__label" }, `Length`), len), lenVal),
    toggles,
    out,
    el("div", { class: "trow grow" }, meter), meterLabel,
    el("div", { class: "trow" }, genBtn, copyBtn)));
  gen();
  return {};
}
export default { mount };
