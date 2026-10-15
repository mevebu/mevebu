// Sets a selling price from a cost and a target margin or markup.
import { el, bench, stack, panel, numberInput, chipRow, notice, copyButton, actions, toolcard } from "../core.js";

function fmt(n) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function tile(label) {
  const value = el("span", { class: "mvb-stat__v" }, "-");
  const node = el("div", { class: "mvb-stat" }, value, el("span", { class: "mvb-stat__k" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

export function mount(slot) {
  const cost = numberInput({ value: "40", min: "0", "aria-label": "Cost per unit" });
  const percent = numberInput({ value: "40", "aria-label": "Target percent" });
  let mode = "margin";
  const chips = chipRow(
    [{ value: "margin", label: "Margin" }, { value: "markup", label: "Markup" }],
    { value: "margin", label: "Target", onChange: (next) => { mode = next; run(); } }
  );
  const price = tile("Selling price");
  const profit = tile("Profit");
  const stats = el("div", { class: "mvb-stats" }, price, profit);
  const error = notice("error");
  let text = "";

  function clear() {
    price.set("-");
    profit.set("-");
    text = "";
  }

  function run() {
    error.write("");
    const c = Number(cost.value);
    const p = Number(percent.value);
    if (cost.value.trim() === "" || percent.value.trim() === "" || !Number.isFinite(c) || !Number.isFinite(p)) {
      clear();
      return;
    }
    if (c < 0) { clear(); error.write("The cost cannot be negative."); return; }
    let selling;
    if (mode === "markup") {
      if (p < -100) { clear(); error.write("The markup cannot drop below -100%."); return; }
      selling = c * (1 + p / 100);
    } else {
      if (p >= 100) { clear(); error.write("A margin must be below 100%."); return; }
      selling = c / (1 - p / 100);
    }
    const gain = selling - c;
    price.set(fmt(selling));
    profit.set(fmt(gain));
    text = `Selling price ${fmt(selling)}, profit ${fmt(gain)}`;
  }

  cost.addEventListener("input", run);
  percent.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Cost per unit", cost), panel("Target", chips), panel("Percent", percent), error),
      stack(stats)
    ),
    foot: actions(copyButton(() => text, "Copy result", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
