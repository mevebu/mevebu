// Looks for arithmetic, geometric and quadratic patterns in a number series.
import { el, bench, stack, panel, textArea, notice, copyButton, actions, toolcard } from "../core.js";

function fmt(n) {
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 6 }) : "-";
}

function parseNumbers(text) {
  const tokens = text.split(/[\s,;]+/).filter(Boolean);
  const nums = tokens.map(Number);
  return { nums, invalid: nums.some((n) => !Number.isFinite(n)) };
}

const kvRow = (key, value) =>
  el("div", { class: "grid gap-3 bg-deck px-3 py-[9px] [grid-template-columns:minmax(90px,34%)_minmax(0,1fr)]" }, el("span", { class: "wrap-anywhere text-2xs font-semibold text-ink-2" }, key), el("span", { class: "wrap-anywhere font-mono text-2xs" }, value));

export function mount(slot) {
  const source = textArea({ rows: 6, value: "2, 5, 8, 11", "aria-label": "Numbers", placeholder: "2, 5, 8, 11" });
  const error = notice("error");

  const terms = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const differences = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const pattern = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const next = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const kv = el("div", { class: "grid gap-px overflow-hidden rounded-r1 border border-orbit bg-orbit" },
    kvRow("Terms", terms),
    kvRow("Differences", differences),
    kvRow("Pattern", pattern),
    kvRow("Next term", next));
  let text = "";

  function clear() {
    terms.textContent = "-";
    differences.textContent = "-";
    pattern.textContent = "-";
    next.textContent = "-";
    text = "";
  }

  function run() {
    error.write("");
    const { nums, invalid } = parseNumbers(source.value);
    if (!source.value.trim()) { clear(); return; }
    if (invalid) { clear(); error.write("Use numbers only, separated by spaces, commas or new lines."); return; }
    if (nums.length < 2) { clear(); error.write("Add at least two numbers."); return; }

    const diffs = nums.slice(1).map((n, i) => n - nums[i]);
    const ratios = nums.slice(1).map((n, i) => (nums[i] === 0 ? NaN : n / nums[i]));
    const second = diffs.slice(1).map((n, i) => n - diffs[i]);

    const same = (list) => list.length > 0 && list.every((value) => Math.abs(value - list[0]) < 1e-9);
    const sameRatio = ratios.length > 0 && ratios.every((value) => Number.isFinite(value) && Math.abs(value - ratios[0]) < 1e-9);

    let name = "No simple pattern";
    let nextTerm = NaN;

    if (same(diffs)) {
      name = `Arithmetic, step ${fmt(diffs[0])}`;
      nextTerm = nums[nums.length - 1] + diffs[0];
    } else if (sameRatio && ratios[0] !== 1) {
      name = `Geometric, ratio ${fmt(ratios[0])}`;
      nextTerm = nums[nums.length - 1] * ratios[0];
    } else if (same(second)) {
      name = "Quadratic, constant second difference";
      nextTerm = nums[nums.length - 1] + diffs[diffs.length - 1] + second[0];
    }

    terms.textContent = String(nums.length);
    differences.textContent = diffs.map(fmt).join(", ");
    pattern.textContent = name;
    next.textContent = fmt(nextTerm);
    text = `Pattern ${name}, next term ${Number.isFinite(nextTerm) ? fmt(nextTerm) : "unknown"}`;
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Numbers", source), error),
      stack(panel("Analysis", kv))
    ),
    foot: actions(copyButton(() => text, "Copy result", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
