// Builds invoice numbers from a prefix, a date and a padded counter.
import { bench, stack, row, panel, textInput, numberInput, switchControl, notice, output, copyButton, downloadButton, actions, toolcard } from "../core.js";

function today() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
}

export function mount(slot) {
  const prefix = textInput({ value: "INV-", "aria-label": "Prefix" });
  const includeDate = switchControl("Include date", { checked: true });
  const digits = numberInput({ value: "4", min: "1", max: "10", "aria-label": "Counter digits" });
  const start = numberInput({ value: "1", min: "0", "aria-label": "Starting number" });
  const count = numberInput({ value: "10", min: "1", max: "500", "aria-label": "How many" });
  const result = output({ rows: 12 });
  const error = notice("error");
  let text = "";

  function run() {
    error.write("");
    const d = parseInt(digits.value, 10);
    const s = parseInt(start.value, 10);
    const n = parseInt(count.value, 10);
    if ([digits, start, count].some((input) => input.value.trim() === "") || ![d, s, n].every(Number.isFinite)) {
      result.write("");
      text = "";
      return;
    }
    if (d < 1 || d > 10) { result.write(""); text = ""; error.write("Use between 1 and 10 counter digits."); return; }
    if (s < 0) { result.write(""); text = ""; error.write("The starting number cannot be negative."); return; }
    const total = Math.max(1, Math.min(500, n));
    const date = includeDate.input.checked ? today() : "";
    const lines = Array.from({ length: total }, (_, i) =>
      `${prefix.value}${date}${String(s + i).padStart(d, "0")}`);
    text = lines.join("\n");
    result.write(text);
  }

  for (const input of [prefix, digits, start, count]) input.addEventListener("input", run);
  includeDate.input.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(
        panel("Prefix", prefix),
        panel("Counter digits", digits),
        row(panel("Start at", start), panel("How many", count)),
        includeDate,
        error
      ),
      stack(panel("Numbers", result))
    ),
    foot: actions(
      downloadButton(() => text, "invoice-numbers.txt"),
      copyButton(() => text, "Copy numbers", "fill")
    ),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
