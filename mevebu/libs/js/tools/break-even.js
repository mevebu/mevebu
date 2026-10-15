// Units and revenue needed to cover the fixed costs.
import { el, bench, stack, panel, numberInput, notice, copyButton, actions, toolcard } from "../core.js";

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
  const fixed = numberInput({ value: "1000", min: "0", "aria-label": "Fixed costs" });
  const price = numberInput({ value: "25", min: "0", "aria-label": "Price per unit" });
  const variable = numberInput({ value: "15", min: "0", "aria-label": "Variable cost per unit" });
  const unitsTile = tile("Break-even units");
  const revenueTile = tile("Revenue");
  const marginTile = tile("Contribution");
  const stats = el("div", { class: "mvb-stats" }, unitsTile, revenueTile, marginTile);
  const error = notice("error");
  let text = "";

  function clear() {
    unitsTile.set("-");
    revenueTile.set("-");
    marginTile.set("-");
    text = "";
  }

  function run() {
    error.write("");
    const inputs = [fixed, price, variable];
    const values = inputs.map((input) => Number(input.value));
    if (inputs.some((input) => input.value.trim() === "") || !values.every(Number.isFinite)) {
      clear();
      return;
    }
    const [f, p, v] = values;
    if (f < 0 || p < 0 || v < 0) { clear(); error.write("The values cannot be negative."); return; }
    const contribution = p - v;
    if (contribution <= 0) { clear(); error.write("The price must be above the variable cost."); return; }
    const units = Math.ceil(f / contribution);
    const revenue = units * p;
    unitsTile.set(String(units));
    revenueTile.set(fmt(revenue));
    marginTile.set(fmt(contribution));
    text = `Break-even ${units} units, revenue ${fmt(revenue)}, contribution ${fmt(contribution)}`;
  }

  for (const input of [fixed, price, variable]) input.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Fixed costs", fixed), panel("Price per unit", price), panel("Variable cost per unit", variable), error),
      stack(stats)
    ),
    foot: actions(copyButton(() => text, "Copy result", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
