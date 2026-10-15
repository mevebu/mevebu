// Fraction arithmetic, kept as a simplified fraction and a decimal.
import { el, bench, stack, panel, numberInput, notice, copyButton, chipRow, actions, toolcard } from "../core.js";

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
  const n1 = numberInput({ value: "1", "aria-label": "First numerator" });
  const d1 = numberInput({ value: "2", "aria-label": "First denominator" });
  const n2 = numberInput({ value: "1", "aria-label": "Second numerator" });
  const d2 = numberInput({ value: "3", "aria-label": "Second denominator" });
  const resultRow = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const decimalRow = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const mixedRow = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const kv = el(
    "div",
    { class: "grid gap-px overflow-hidden rounded-r1 border border-orbit bg-orbit" },
    kvRow("Fraction", resultRow),
    kvRow("Decimal", decimalRow),
    kvRow("Mixed number", mixedRow)
  );
  const error = notice("error");
  let op = "+";
  let text = "";

  function clear() {
    resultRow.textContent = "-";
    decimalRow.textContent = "-";
    mixedRow.textContent = "-";
    text = "";
  }

  function run() {
    error.write("");
    const A = Number(n1.value);
    const B = Number(d1.value);
    const C = Number(n2.value);
    const D = Number(d2.value);
    if ([n1, d1, n2, d2].some((input) => input.value.trim() === "") || ![A, B, C, D].every(Number.isFinite)) {
      clear();
      return;
    }
    if (B === 0 || D === 0) {
      clear();
      error.write("A denominator cannot be zero.");
      return;
    }
    let num;
    let den;
    if (op === "+") { num = A * D + C * B; den = B * D; }
    else if (op === "-") { num = A * D - C * B; den = B * D; }
    else if (op === "x") { num = A * C; den = B * D; }
    else {
      if (C === 0) {
        clear();
        error.write("Cannot divide by a fraction with a zero numerator.");
        return;
      }
      num = A * D;
      den = B * C;
    }
    if (den < 0) { num = -num; den = -den; }
    const divisor = gcd(num, den) || 1;
    const simpleNum = num / divisor;
    const simpleDen = den / divisor;
    const fraction = simpleDen === 1 ? String(simpleNum) : `${simpleNum}/${simpleDen}`;
    const decimal = num / den;
    resultRow.textContent = fraction;
    decimalRow.textContent = fmt(decimal);
    const whole = Math.trunc(simpleNum / simpleDen);
    const rest = Math.abs(simpleNum % simpleDen);
    mixedRow.textContent = simpleDen !== 1 && Math.abs(simpleNum) > simpleDen && rest !== 0
      ? `${whole} ${rest}/${simpleDen}`
      : fraction;
    text = fraction;
  }

  const chips = chipRow(
    [
      { value: "+", label: "+" },
      { value: "-", label: "-" },
      { value: "x", label: "x" },
      { value: "/", label: "/" }],
    {
      value: op,
      label: "Operation",
      onChange: (value) => {
        op = value;
        run();
      }}
  );

  for (const input of [n1, d1, n2, d2]) input.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(
        panel("First fraction", el("div", { class: "flex min-w-0 flex-wrap items-center gap-2" }, n1, d1)),
        panel("Operation", chips),
        panel("Second fraction", el("div", { class: "flex min-w-0 flex-wrap items-center gap-2" }, n2, d2)),
        error
      ),
      stack(panel("Result", kv))
    ),
    foot: actions(copyButton(() => text, "Copy fraction", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
