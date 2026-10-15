// Converts a number to and from scientific notation.
import { el, bench, stack, panel, textInput, notice, copyButton, actions, toolcard } from "../core.js";

function parseNumber(text) {
  const clean = text.trim().toLowerCase().replace(/×/g, "x").replace(/\s+/g, "");
  if (!clean) return null;
  const match = clean.match(/^([+-]?\d*\.?\d+)x10\^?([+-]?\d+)$/);
  if (match) return Number(match[1]) * 10 ** Number(match[2]);
  const value = Number(clean);
  return Number.isFinite(value) ? value : null;
}

function decimalForm(n) {
  if (n === 0) return "0";
  if (Math.abs(n) >= 1e21 || Math.abs(n) < 1e-6) return n.toExponential();
  return n.toLocaleString(undefined, { maximumFractionDigits: 20 });
}

const kvRow = (key, value) =>
  el("div", { class: "mvb-kv__row" }, el("span", { class: "mvb-kv__k" }, key), el("span", { class: "mvb-kv__v" }, value));

export function mount(slot) {
  const source = textInput({ value: "3.2e8", "aria-label": "Number", placeholder: "3.2e8 or 320000000" });
  const scientific = el("span", { class: "mvb-kv__v" }, "-");
  const eForm = el("span", { class: "mvb-kv__v" }, "-");
  const decimal = el("span", { class: "mvb-kv__v" }, "-");
  const coefficient = el("span", { class: "mvb-kv__v" }, "-");
  const exponent = el("span", { class: "mvb-kv__v" }, "-");
  const kv = el(
    "div",
    { class: "mvb-kv" },
    kvRow("Scientific", scientific),
    kvRow("E notation", eForm),
    kvRow("Decimal", decimal),
    kvRow("Coefficient", coefficient),
    kvRow("Exponent", exponent)
  );
  const error = notice("error");
  let text = "";

  function clear() {
    for (const node of [scientific, eForm, decimal, coefficient, exponent]) node.textContent = "-";
    text = "";
  }

  function run() {
    error.write("");
    if (!source.value.trim()) {
      clear();
      return;
    }
    const value = parseNumber(source.value);
    if (value === null) {
      clear();
      error.write("That is not a number this browser can read.");
      return;
    }
    const [mantissa, rawExponent] = value.toExponential().split("e");
    const power = Number(rawExponent);
    scientific.textContent = `${mantissa} x 10^${power}`;
    eForm.textContent = value.toExponential();
    decimal.textContent = decimalForm(value);
    coefficient.textContent = mantissa;
    exponent.textContent = String(power);
    text = `${mantissa} x 10^${power}`;
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Number", source), error),
      stack(panel("Forms", kv))
    ),
    foot: actions(copyButton(() => text, "Copy scientific", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
