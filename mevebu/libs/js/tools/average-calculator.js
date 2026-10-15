// Mean, median and mode from a list of numbers.
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
  const source = textArea({ rows: 8, value: "4, 8, 15, 16, 23, 42", "aria-label": "Numbers", placeholder: "4, 8, 15, 16, 23, 42" });
  const mean = tile("Mean");
  const median = tile("Median");
  const mode = tile("Mode");
  const count = tile("Count");
  const sum = tile("Sum");
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" }, mean, median, mode, count, sum);
  const error = notice("error");
  let text = "";

  function clear() {
    for (const item of [mean, median, mode, count, sum]) item.set("-");
    text = "";
  }

  function run() {
    error.write("");
    const { nums, invalid } = parseNumbers(source.value);
    if (!nums.length) {
      clear();
      return;
    }
    if (invalid) {
      clear();
      error.write("Use numbers only, separated by spaces, commas or new lines.");
      return;
    }
    const total = nums.reduce((acc, n) => acc + n, 0);
    const average = total / nums.length;
    const sorted = nums.slice().sort((x, y) => x - y);
    const middle = Math.floor(sorted.length / 2);
    const med = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;

    const counts = new Map();
    for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1);
    const top = Math.max(...counts.values());
    const modes = top > 1 ? [...counts].filter(([, hits]) => hits === top).map(([value]) => value) : [];

    mean.set(fmt(average));
    median.set(fmt(med));
    mode.set(modes.length ? modes.map(fmt).join(", ") : "None");
    count.set(String(nums.length));
    sum.set(fmt(total));
    text = `Count ${nums.length}, sum ${fmt(total)}, mean ${fmt(average)}, median ${fmt(med)}, mode ${modes.length ? modes.map(fmt).join(", ") : "none"}`;
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Numbers", source), error),
      stack(stats)
    ),
    foot: actions(copyButton(() => text, "Copy summary", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
