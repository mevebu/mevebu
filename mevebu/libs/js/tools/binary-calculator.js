// Adds or subtracts two binary numbers and shows the result in binary and decimal.
import { el, bench, stack, panel, textInput, chipRow, notice, copyButton, actions, toolcard } from "../core.js";

function parse(text) {
  const clean = text.trim().replace(/[\s_]/g, "").replace(/^0b/i, "");
  if (!clean || !/^[01]+$/.test(clean)) return null;
  return BigInt(`0b${clean}`);
}

export function mount(slot) {
  const first = textInput({ value: "1011", class: "mvb-in mvb-in--mono", "aria-label": "First number" });
  const second = textInput({ value: "0110", class: "mvb-in mvb-in--mono", "aria-label": "Second number" });
  const result = el("span", { class: "mvb-stat__v" }, "-");
  const stats = el("div", { class: "mvb-stats" }, el("div", { class: "mvb-stat" }, el("span", { class: "mvb-stat__k" }, "Binary"), result));
  const decimal = el("p", { class: "mvb-note" });
  const error = notice("error");
  let mode = "add";
  let text = "";

  const chips = chipRow(
    [{ value: "add", label: "Add" }, { value: "subtract", label: "Subtract" }],
    { value: mode, label: "Operation", onChange: (value) => { mode = value; run(); } }
  );

  function run() {
    error.write("");
    const a = parse(first.value);
    const b = parse(second.value);
    if (a === null || b === null) {
      result.textContent = "-";
      decimal.textContent = "";
      text = "";
      error.write("Use only 0 and 1.");
      return;
    }
    const value = mode === "add" ? a + b : a - b;
    result.textContent = value.toString(2);
    decimal.textContent = `Decimal ${value.toString(10)}`;
    text = `${value.toString(2)} (decimal ${value.toString(10)})`;
  }

  first.addEventListener("input", run);
  second.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("First number", first), panel("Second number", second), panel("Operation", chips), error),
      stack(panel("Result", stats), decimal)
    ),
    foot: actions(copyButton(() => text, "Copy result", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
