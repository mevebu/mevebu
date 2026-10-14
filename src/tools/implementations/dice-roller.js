// Dice Roller — d4/d6/d8/d10/d12/d20, multi-roll + total
import { el, icon, chipGroup, cryptoRandomInt } from "../../lib/dom.js";

export function mount(container) {
  let sides = 6;
  const chips = chipGroup(
    [4, 6, 8, 10, 12, 20].map((n) => ({ value: n, label: `d${n}` })),
    { value: 6, onChange: (v) => { sides = v; } }
  );
  const count = el("input", { class: "tinput tnum", type: "number", min: "1", max: "50", value: "3" });
  const rollBtn = el("button", { class: "btn btn--accent", type: "button" }, icon("dices"), "Roll");
  const faces = el("div", { class: "dice__faces" });
  const total = el("div", { class: "dice__total" }, "");

  rollBtn.addEventListener("click", () => {
    const n = Math.max(1, Math.min(50, parseInt(count.value || "1", 10)));
    const rolls = Array.from({ length: n }, () => 1 + cryptoRandomInt(sides));
    faces.innerHTML = "";
    rolls.forEach((r) => faces.append(el("span", { class: "die" }, String(r))));
    total.textContent = `${n} × d${sides} → [${rolls.join(", ")}] · total ${rolls.reduce((a, b) => a + b, 0)}`;
  });

  container.append(el("div", { class: "center-col tstack" },
    el("div", { class: "trow" }, chips, el("label", { class: "tfield" }, el("span", { class: "tfield__label" }, "# of dice"), count)),
    rollBtn, faces, total));
  return {};
}
export default { mount };
