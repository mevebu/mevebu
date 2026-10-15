// Tidies spacing in pasted text: collapses runs of spaces, trims each line and
// optionally drops blank lines.
import { bench, stack, panel, textArea, toggleRow, copyButton, actions, toolcard } from "../core.js";

export function mount(slot) {
  const source = textArea({ rows: 12, "aria-label": "Text", placeholder: "Paste your text" });
  const result = textArea({ rows: 12, readonly: true, "aria-label": "Result" });
  const options = toggleRow([
    { value: "collapse", label: "Collapse spaces", checked: true },
    { value: "trim", label: "Trim lines", checked: true },
    { value: "blank", label: "Remove blank lines", checked: false }]);

  function run() {
    const text = source.value;
    if (!text) { result.value = ""; return; }
    const opts = options.values();
    let lines = text.split("\n");
    if (opts.includes("trim")) lines = lines.map((line) => line.trim());
    if (opts.includes("collapse")) lines = lines.map((line) => line.replace(/[ \t]+/g, " "));
    if (opts.includes("blank")) lines = lines.filter((line) => line.trim());
    result.value = lines.join("\n");
  }

  source.addEventListener("input", run);
  options.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(panel("Text", source), options),
      stack(panel("Result", result))
    ),
    foot: actions(copyButton(() => result.value, "Copy result", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
