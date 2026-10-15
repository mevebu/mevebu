// One or two discounts on a price, with optional tax added after.
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
  const price = numberInput({ value: "120", "aria-label": "Original price" });
  const first = numberInput({ value: "20", "aria-label": "First discount percent" });
  const second = numberInput({ placeholder: "None", "aria-label": "Second discount percent" });
  const tax = numberInput({ placeholder: "None", "aria-label": "Tax percent" });
  const finalTile = tile("Final price");
  const savedTile = tile("Saved");
  const effectiveTile = tile("Effective discount");
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" }, finalTile, savedTile, effectiveTile);
  const error = notice("error");
  let text = "";

  function clear() {
    finalTile.set("-");
    savedTile.set("-");
    effectiveTile.set("-");
    text = "";
  }

  function run() {
    error.write("");
    const p = Number(price.value);
    const d1 = first.value.trim() === "" ? 0 : Number(first.value);
    const d2 = second.value.trim() === "" ? 0 : Number(second.value);
    const t = tax.value.trim() === "" ? 0 : Number(tax.value);
    if (price.value.trim() === "" || ![p, d1, d2, t].every(Number.isFinite)) {
      clear();
      return;
    }
    if (p < 0 || d1 < 0 || d2 < 0 || t < 0) {
      clear();
      error.write("The price, discounts and tax cannot be negative.");
      return;
    }
    const afterDiscounts = p * (1 - d1 / 100) * (1 - d2 / 100);
    const finalPrice = afterDiscounts * (1 + t / 100);
    const saved = p - afterDiscounts;
    const effective = p === 0 ? 0 : (saved / p) * 100;
    finalTile.set(fmt(finalPrice));
    savedTile.set(fmt(saved));
    effectiveTile.set(`${fmt(effective)}%`);
    text = `Final price ${fmt(finalPrice)}, saved ${fmt(saved)}, effective discount ${fmt(effective)}%`;
  }

  price.addEventListener("input", run);
  first.addEventListener("input", run);
  second.addEventListener("input", run);
  tax.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(
        panel("Original price", price),
        panel("First discount %", first),
        panel("Second discount %", second),
        panel("Tax %", tax),
        error
      ),
      stack(stats)
    ),
    foot: actions(copyButton(() => text, "Copy result", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
