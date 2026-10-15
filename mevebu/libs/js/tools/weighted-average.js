// Weighted mean from paired value and weight lists.
import { el, bench, stack, panel, textArea, notice, copyButton, actions, toolcard } from "../core.js";

function fmt(n) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function parseNumbers(text) {
  const tokens = text.split(/[\s,;]+/).filter(Boolean);
  const nums = tokens.map(Number);
  return { nums, invalid: nums.some((n) => !Number.isFinite(n)) };
}

function tile(label) {
  const value = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, "-");
  const node = el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, value, el("span", { class: "text-2xs font-semibold text-ink-3" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

export function mount(slot) {
  const values = textArea({ rows: 6, value: "85, 90, 70", "aria-label": "Values", placeholder: "85, 90, 70" });
  const weights = textArea({ rows: 6, value: "2, 3, 1", "aria-label": "Weights", placeholder: "2, 3, 1" });
  const weighted = tile("Weighted average");
  const totalWeight = tile("Total weight");
  const count = tile("Count");
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" }, weighted, totalWeight, count);
  const error = notice("error");
  let text = "";

  function clear() {
    weighted.set("-");
    totalWeight.set("-");
    count.set("-");
    text = "";
  }

  function run() {
    error.write("");
    const left = parseNumbers(values.value);
    const right = parseNumbers(weights.value);
    if (!left.nums.length || !right.nums.length) {
      clear();
      return;
    }
    if (left.invalid || right.invalid) {
      clear();
      error.write("Use numbers only, separated by spaces, commas or new lines.");
      return;
    }
    if (left.nums.length !== right.nums.length) {
      clear();
      error.write(`There are ${left.nums.length} values and ${right.nums.length} weights.`);
      return;
    }
    const weightSum = right.nums.reduce((acc, n) => acc + n, 0);
    if (weightSum === 0) {
      clear();
      error.write("The weights add up to zero.");
      return;
    }
    const products = left.nums.reduce((acc, n, i) => acc + n * right.nums[i], 0);
    const result = products / weightSum;
    weighted.set(fmt(result));
    totalWeight.set(fmt(weightSum));
    count.set(String(left.nums.length));
    text = `Weighted average ${fmt(result)}, total weight ${fmt(weightSum)}, values ${left.nums.length}`;
  }

  values.addEventListener("input", run);
  weights.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Values", values), panel("Weights", weights), error),
      stack(stats)
    ),
    foot: actions(copyButton(() => text, "Copy summary", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
