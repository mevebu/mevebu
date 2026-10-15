// Converts a number between binary, octal, decimal and hexadecimal.
import { el, bench, stack, panel, textInput, notice, copyButton, chipRow, actions, toolcard } from "../core.js";

const BASES = [
  { value: "2", label: "Binary" },
  { value: "8", label: "Octal" },
  { value: "10", label: "Decimal" },
  { value: "16", label: "Hex" }];

const PATTERNS = { 2: /^[01]+$/, 8: /^[0-7]+$/, 10: /^[0-9]+$/, 16: /^[0-9a-f]+$/ };
const PREFIX = { 2: "0b", 8: "0o", 10: "", 16: "0x" };

function parseInBase(text, base) {
  let clean = text.trim().toLowerCase().replace(/[\s_]/g, "");
  if (!clean) return null;
  let sign = 1n;
  if (clean.startsWith("-")) { sign = -1n; clean = clean.slice(1); }
  else if (clean.startsWith("+")) clean = clean.slice(1);
  clean = clean.replace(/^0[bxo]/, "");
  if (!PATTERNS[base].test(clean)) return null;
  return sign * BigInt(PREFIX[base] + clean);
}

const kvRow = (key, value) =>
  el("div", { class: "grid gap-3 bg-deck px-3 py-[9px] [grid-template-columns:minmax(90px,34%)_minmax(0,1fr)]" }, el("span", { class: "wrap-anywhere text-2xs font-semibold text-ink-2" }, key), el("span", { class: "wrap-anywhere font-mono text-2xs" }, value));

export function mount(slot) {
  const source = textInput({ value: "255", "aria-label": "Number", placeholder: "255" });
  const binary = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const octal = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const decimal = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const hex = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const kv = el(
    "div",
    { class: "grid gap-px overflow-hidden rounded-r1 border border-orbit bg-orbit" },
    kvRow("Binary", binary),
    kvRow("Octal", octal),
    kvRow("Decimal", decimal),
    kvRow("Hex", hex)
  );
  const error = notice("error");
  let base = "10";
  let text = "";

  function clear() {
    binary.textContent = "-";
    octal.textContent = "-";
    decimal.textContent = "-";
    hex.textContent = "-";
    text = "";
  }

  function run() {
    error.write("");
    if (!source.value.trim()) {
      clear();
      return;
    }
    const value = parseInBase(source.value, base);
    if (value === null) {
      clear();
      error.write(`That is not a valid ${BASES.find((entry) => entry.value === base).label.toLowerCase()} number.`);
      return;
    }
    binary.textContent = value.toString(2);
    octal.textContent = value.toString(8);
    decimal.textContent = value.toString(10);
    hex.textContent = value.toString(16).toUpperCase();
    text = `Binary ${value.toString(2)}\nOctal ${value.toString(8)}\nDecimal ${value.toString(10)}\nHex ${value.toString(16).toUpperCase()}`;
  }

  const chips = chipRow(BASES, {
    value: base,
    label: "Input base",
    onChange: (value) => {
      base = value;
      run();
    }});

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Number", source), panel("Input base", chips), error),
      stack(panel("In every base", kv))
    ),
    foot: actions(copyButton(() => text, "Copy all", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
