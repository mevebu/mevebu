// Drops repeated lines and keeps the first time each one appears.
import { bench, stack, panel, textArea, output, checkbox, notice, copyButton, actions, toolcard } from "../core.js";

export function mount(slot) {
  const source = textArea({ rows: 12, "aria-label": "Text", placeholder: "Paste your list, one entry per line" });
  const ignoreCase = checkbox("Ignore case", { checked: false });
  const result = output({ tag: "textarea", rows: 12 });
  const note = notice("note");

  function run() {
    const text = source.value;
    if (!text) {
      result.value = "";
      note.write("");
      return;
    }
    const lines = text.split("\n");
    const seen = new Set();
    const kept = [];
    let removed = 0;
    for (const line of lines) {
      const key = ignoreCase.input.checked ? line.toLowerCase() : line;
      if (seen.has(key)) removed++;
      else { seen.add(key); kept.push(line); }
    }
    result.value = kept.join("\n");
    note.write(removed ? `${removed} line${removed === 1 ? "" : "s"} removed.` : "No duplicate lines found.");
  }

  source.addEventListener("input", run);
  ignoreCase.input.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(panel("Text", source), ignoreCase, note),
      stack(panel("Result", result))
    ),
    foot: actions(copyButton(() => result.value, "Copy result", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
