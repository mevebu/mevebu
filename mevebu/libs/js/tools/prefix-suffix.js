// Adds a prefix, a suffix, or automatic numbering to every line.
import { bench, stack, panel, textArea, textInput, checkbox, copyButton, actions, toolcard } from "../core.js";

export function mount(slot) {
  const source = textArea({ rows: 11, "aria-label": "Text", placeholder: "Paste your list, one entry per line" });
  const prefixField = textInput({ placeholder: "Prefix", "aria-label": "Prefix" });
  const suffixField = textInput({ placeholder: "Suffix", "aria-label": "Suffix" });
  const numbering = checkbox("Numbering", { checked: false });
  const result = textArea({ rows: 11, readonly: true, class: "mvb-in mvb-in--area mvb-in--mono", "aria-label": "Result" });

  function run() {
    const text = source.value;
    if (!text) { result.value = ""; return; }
    const prefix = prefixField.value;
    const suffix = suffixField.value;
    const numbered = numbering.input.checked;
    result.value = text
      .split("\n")
      .map((line, index) => `${numbered ? `${index + 1}. ` : ""}${prefix}${line}${suffix}`)
      .join("\n");
  }

  source.addEventListener("input", run);
  prefixField.addEventListener("input", run);
  suffixField.addEventListener("input", run);
  numbering.input.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(
        panel("Text", source),
        panel("Prefix", prefixField),
        panel("Suffix", suffixField),
        numbering
      ),
      stack(panel("Result", result))
    ),
    foot: actions(copyButton(() => result.value, "Copy result", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
