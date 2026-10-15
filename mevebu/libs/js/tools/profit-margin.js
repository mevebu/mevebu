// Profit, margin and markup from a cost and a selling price.
import { el, bench, stack, panel, numberInput, notice, copyButton, actions, toolcard } from "../core.js";

function fmt(n) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function tile(label) {
  const value = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, "-");
  const node = el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, value, el("span", { class: "text-2xs font-semibold text-ink-3" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

export function mount(slot) {
  const cost = numberInput({ value: "40", "aria-label": "Cost" });
  const price = numberInput({ value: "100", "aria-label": "Selling price" });
  const profit = tile("Profit");
  const margin = tile("Margin");
  const markup = tile("Markup");
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" }, profit, margin, markup);
  const error = notice("error");
  let text = "";

  function clear() {
    profit.set("-");
    margin.set("-");
    markup.set("-");
    text = "";
  }

  function run() {
    error.write("");
    const c = Number(cost.value);
    const p = Number(price.value);
    if (cost.value.trim() === "" || price.value.trim() === "" || !Number.isFinite(c) || !Number.isFinite(p)) {
      clear();
      return;
    }
    if (c < 0 || p < 0) {
      clear();
      error.write("The cost and price cannot be negative.");
      return;
    }
    const gain = p - c;
    profit.set(fmt(gain));
    margin.set(p === 0 ? "-" : `${fmt((gain / p) * 100)}%`);
    markup.set(c === 0 ? "-" : `${fmt((gain / c) * 100)}%`);
    text = `Profit ${fmt(gain)}, margin ${p === 0 ? "n/a" : `${fmt((gain / p) * 100)}%`}, markup ${c === 0 ? "n/a" : `${fmt((gain / c) * 100)}%`}`;
    if (p === 0 || c === 0) error.write("Margin needs a price and markup needs a cost above zero.");
  }

  cost.addEventListener("input", run);
  price.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Cost", cost), panel("Selling price", price), error),
      stack(stats)
    ),
    foot: actions(copyButton(() => text, "Copy result", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
