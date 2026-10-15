// Turns a percent into a simplified fraction, with the decimal and mixed form.
import { el, bench, stack, panel, textInput, notice, copyButton, actions, toolcard } from "../core.js";

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
  return n.toLocaleString(undefined, { maximumFractionDigits: 10 });
}

const kvRow = (key, value) =>
  el("div", { class: "mvb-kv__row" }, el("span", { class: "mvb-kv__k" }, key), el("span", { class: "mvb-kv__v" }, value));

export function mount(slot) {
  const source = textInput({ value: "12.5", "aria-label": "Percent", placeholder: "12.5" });
  const fraction = el("span", { class: "mvb-kv__v" }, "-");
  const decimal = el("span", { class: "mvb-kv__v" }, "-");
  const mixed = el("span", { class: "mvb-kv__v" }, "-");
  const kv = el(
    "div",
    { class: "mvb-kv" },
    kvRow("Fraction", fraction),
    kvRow("Decimal", decimal),
    kvRow("Mixed number", mixed)
  );
  const error = notice("error");
  let text = "";

  function clear() {
    fraction.textContent = "-";
    decimal.textContent = "-";
    mixed.textContent = "-";
    text = "";
  }

  function run() {
    error.write("");
    const raw = source.value.trim();
    if (!raw) {
      clear();
      return;
    }
    if (!/^[+-]?\d*\.?\d+$/.test(raw)) {
      clear();
      error.write("Enter a percent, for example 12.5.");
      return;
    }
    const negative = raw.startsWith("-");
    const clean = raw.replace(/^[+-]/, "");
    const [whole, decimals = ""] = clean.split(".");
    const numerator = Number(whole + decimals);
    const denominator = 100 * 10 ** decimals.length;
    if (!Number.isFinite(numerator)) {
      clear();
      error.write("That percent is too large to convert exactly.");
      return;
    }
    const divisor = gcd(numerator, denominator) || 1;
    let simpleNum = numerator / divisor;
    const simpleDen = denominator / divisor;
    if (negative) simpleNum = -simpleNum;
    const fractionText = simpleDen === 1 ? String(simpleNum) : `${simpleNum}/${simpleDen}`;
    fraction.textContent = fractionText;
    decimal.textContent = fmt(simpleNum / simpleDen);
    const wholePart = Math.trunc(simpleNum / simpleDen);
    const rest = Math.abs(simpleNum % simpleDen);
    mixed.textContent = simpleDen !== 1 && Math.abs(simpleNum) > simpleDen && rest !== 0
      ? `${wholePart} ${rest}/${simpleDen}`
      : fractionText;
    text = fractionText;
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Percent", source), error),
      stack(panel("Result", kv))
    ),
    foot: actions(copyButton(() => text, "Copy fraction", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
