// Converts a number to a Roman numeral, or a Roman numeral to a number.
import { el, bench, stack, panel, textInput, notice, copyButton, actions, toolcard } from "../core.js";

const NUMERALS = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
  [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

function toRoman(n) {
  let rest = n;
  let out = "";
  for (const [value, symbol] of NUMERALS) {
    while (rest >= value) {
      out += symbol;
      rest -= value;
    }
  }
  return out;
}

function fromRoman(text) {
  const values = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };
  let total = 0;
  const upper = text.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    const current = values[upper[i].toLowerCase()];
    const next = values[upper[i + 1]?.toLowerCase()];
    if (next && current < next) total -= current;
    else total += current;
  }
  return total;
}

const kvRow = (key, value) =>
  el("div", { class: "mvb-kv__row" }, el("span", { class: "mvb-kv__k" }, key), el("span", { class: "mvb-kv__v" }, value));

export function mount(slot) {
  const source = textInput({ value: "2026", "aria-label": "Number or Roman numeral", placeholder: "2026 or MMXXVI" });
  const detected = el("span", { class: "mvb-kv__v" }, "-");
  const result = el("span", { class: "mvb-kv__v" }, "-");
  const kv = el(
    "div",
    { class: "mvb-kv" },
    kvRow("Input", detected),
    kvRow("Result", result)
  );
  const error = notice("error");
  let text = "";

  function clear() {
    detected.textContent = "-";
    result.textContent = "-";
    text = "";
  }

  function run() {
    error.write("");
    const value = source.value.trim();
    if (!value) {
      clear();
      return;
    }
    if (/^[0-9]+$/.test(value)) {
      const number = Number(value);
      if (number < 1 || number > 3999) {
        clear();
        error.write("Roman numerals cover 1 to 3999.");
        return;
      }
      detected.textContent = "Number";
      result.textContent = toRoman(number);
      text = toRoman(number);
      return;
    }
    if (/^[ivxlcdm]+$/i.test(value)) {
      const number = fromRoman(value);
      if (number < 1 || number > 3999 || toRoman(number) !== value.toUpperCase()) {
        clear();
        error.write("That is not a standard Roman numeral.");
        return;
      }
      detected.textContent = "Roman numeral";
      result.textContent = String(number);
      text = String(number);
      return;
    }
    clear();
    error.write("Enter a number from 1 to 3999, or a Roman numeral.");
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Number or Roman numeral", source), error),
      stack(panel("Result", kv))
    ),
    foot: actions(copyButton(() => text, "Copy result", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
