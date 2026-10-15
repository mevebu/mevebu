// Simplifies a ratio and solves the missing term in a proportion.
import { el, bench, stack, panel, numberInput, textInput, notice, copyButton, actions, toolcard } from "../core.js";

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const next = a % b;
    a = b;
    b = next;
  }
  return a;
}

function fmt(n) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

const kvRow = (key, value) =>
  el("div", { class: "grid gap-3 bg-deck px-3 py-[9px] [grid-template-columns:minmax(90px,34%)_minmax(0,1fr)]" }, el("span", { class: "wrap-anywhere text-2xs font-semibold text-ink-2" }, key), el("span", { class: "wrap-anywhere font-mono text-2xs" }, value));

export function mount(slot) {
  const ratioInput = textInput({ value: "12:18:24", "aria-label": "Ratio" });
  const a = numberInput({ placeholder: "A", "aria-label": "First term" });
  const b = numberInput({ placeholder: "B", "aria-label": "Second term" });
  const c = numberInput({ placeholder: "C", "aria-label": "Third term" });
  const d = numberInput({ placeholder: "D", "aria-label": "Fourth term" });
  const simplified = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const decimal = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const missing = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const kv = el(
    "div",
    { class: "grid gap-px overflow-hidden rounded-r1 border border-orbit bg-orbit" },
    kvRow("Simplified ratio", simplified),
    kvRow("Decimal", decimal),
    kvRow("Missing term", missing)
  );
  const error = notice("error");
  let text = "";

  function simplify() {
    const tokens = ratioInput.value.split(/[^0-9.]+/).filter(Boolean);
    const nums = tokens.map(Number);
    simplified.textContent = "-";
    decimal.textContent = "-";
    if (!ratioInput.value.trim()) return "";
    if (tokens.length < 2 || !nums.every(Number.isFinite)) {
      error.write("Use numbers separated by colons, for example 12:18:24.");
      return "";
    }
    const divisor = nums.reduce((acc, n) => gcd(acc, n), 0);
    if (!divisor) return "";
    const out = nums.map((n) => n / divisor);
    simplified.textContent = out.join(" : ");
    if (nums.length === 2 && nums[1] !== 0) decimal.textContent = fmt(nums[0] / nums[1]);
    return out.join(":");
  }

  function solve() {
    const terms = [a, b, c, d].map((input) => input.value.trim());
    missing.textContent = "-";
    if (terms.filter((term) => term !== "").length !== 3) return "";
    const nums = terms.map((term) => (term === "" ? null : Number(term)));
    if (nums.some((n) => n !== null && !Number.isFinite(n))) return "";
    const [A, B, C, D] = nums;
    let value = null;
    if (D === null) value = A === 0 ? null : (B * C) / A;
    else if (A === null) value = D === 0 ? null : (B * C) / D;
    else if (B === null) value = C === 0 ? null : (A * D) / C;
    else if (C === null) value = A === 0 ? null : (B * D) / A;
    if (value === null || !Number.isFinite(value)) return "";
    missing.textContent = fmt(value);
    return fmt(value);
  }

  function run() {
    error.write("");
    const ratio = simplify();
    const term = solve();
    text = ratio || term;
  }

  ratioInput.addEventListener("input", run);
  for (const input of [a, b, c, d]) input.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(
        panel("Ratio", ratioInput),
        panel("Proportion", el("div", { class: "flex min-w-0 flex-wrap items-center gap-2" }, a, b, c, d)),
        error
      ),
      stack(panel("Result", kv))
    ),
    foot: actions(copyButton(() => text, "Copy result", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
