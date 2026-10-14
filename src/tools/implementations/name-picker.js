// Pick a Random Name — draw N winners from a list
import { el, icon, toast, copyText, cryptoShuffle } from "../../lib/dom.js";

export function mount(container) {
  const ta = el("textarea", { class: "tinput ttextarea", rows: 8, spellcheck: "false", placeholder: "Paste names — one per line (or comma separated)…" });
  ta.value = "Ana\nBudi\nCitra\nDimas\nElena\nFajar\nGita\nHendra";

  const count = el("input", { class: "tinput tnum", type: "number", min: "1", value: "1" });
  const dedupe = el("input", { type: "checkbox", checked: true });

  const drawBtn = el("button", { class: "btn btn--accent", type: "button" }, icon("hand"), "Draw");
  const out = el("div", { class: "pick__result" }, "—");

  function entries() {
    const raw = ta.value.includes(",") && !ta.value.includes("\n") ? ta.value.split(",") : ta.value.split(/\n+/);
    return raw.map((s) => s.trim()).filter(Boolean);
  }

  drawBtn.addEventListener("click", () => {
    const list = entries();
    if (!list.length) return toast("Add some entries first.");
    const n = Math.max(1, Math.min(list.length, parseInt(count.value || "1", 10)));
    const picked = cryptoShuffle(list).slice(0, n);
    out.innerHTML = "";
    picked.forEach((p, i) => out.append(el("span", { class: `pick__chip pick__chip--${i % 6}` }, p)));
    out.dataset.value = picked.join(", ");
  });

  out.addEventListener("dblclick", async () => {
    if (out.dataset.value) { await copyText(out.dataset.value) && toast("Copied ✓"); }
  });

  container.append(el("div", { class: "split" },
    el("div", { class: "tstack" },
      el("label", { class: "tfield" }, el("span", { class: "tfield__label" }, "Entries"), ta)),
    el("div", { class: "tstack" },
      el("div", { class: "trow" },
        el("label", { class: "tfield" }, el("span", { class: "tfield__label" }, "Winners"), count),
        el("label", { class: "tcheck" }, dedupe, "Unique only")),
      drawBtn,
      el("label", { class: "tfield" }, el("span", { class: "tfield__label" }, "Result (double-click to copy)"), out))
  ));

  return {};
}
export default { mount };
