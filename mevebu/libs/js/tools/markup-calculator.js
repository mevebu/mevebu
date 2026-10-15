// Turns a cost and a target markup into a selling price.
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
  const cost = numberInput({ value: "40", "aria-label": "Cost" });
  const markup = numberInput({ value: "150", "aria-label": "Markup percent" });
  const price = tile("Selling price");
  const profit = tile("Profit");
  const margin = tile("Margin");
  const stats = el("div", { class: "mvb-stats" }, price, profit, margin);
  const error = notice("error");
  let text = "";

  function clear() {
    price.set("-");
    profit.set("-");
    margin.set("-");
    text = "";
  }

  function run() {
    error.write("");
    const c = Number(cost.value);
    const m = Number(markup.value);
    if (cost.value.trim() === "" || markup.value.trim() === "" || !Number.isFinite(c) || !Number.isFinite(m)) {
      clear();
      return;
    }
    if (c < 0 || m < -100) {
      clear();
      error.write("The cost cannot be negative and the markup cannot drop below -100%.");
      return;
    }
    const selling = c * (1 + m / 100);
    const gain = selling - c;
    price.set(fmt(selling));
    profit.set(fmt(gain));
    margin.set(selling === 0 ? "-" : `${fmt((gain / selling) * 100)}%`);
    text = `Selling price ${fmt(selling)}, profit ${fmt(gain)}, margin ${selling === 0 ? "n/a" : `${fmt((gain / selling) * 100)}%`}`;
  }

  cost.addEventListener("input", run);
  markup.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Cost", cost), panel("Markup %", markup), error),
      stack(stats)
    ),
    foot: actions(copyButton(() => text, "Copy result", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
