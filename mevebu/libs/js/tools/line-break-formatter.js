// Tidies the spacing in a caption, with even gaps between paragraphs.
import { el, bench, stack, panel, textArea, numberInput, switchControl, output, copyButton, actions, toolcard } from "../core.js";

export function mount(slot) {
  const source = textArea({ rows: 10, "aria-label": "Text", placeholder: "Type or paste text" });
  const blankLines = numberInput({ min: "0", max: "4", value: "1", "aria-label": "Blank lines between paragraphs" });
  const trim = switchControl("Trim trailing spaces", { checked: true });
  const out = output({ rows: 10 });

  let result = "";

  function run() {
    const normalized = source.value.replace(/\r\n?/g, "\n");
    const paragraphs = normalized
      .split(/\n{2,}/)
      .map((block) => block
        .split("\n")
        .map((line) => (trim.input.checked ? line.replace(/\s+$/, "") : line))
        .join("\n"))
      .map((block) => block.replace(/^\n+|\n+$/g, ""))
      .filter((block) => block.trim() !== "");
    const gap = "\n".repeat(1 + Math.max(0, parseInt(blankLines.value, 10) || 0));
    result = paragraphs.join(gap);
    out.write(result);
  }

  source.addEventListener("input", run);
  blankLines.addEventListener("input", run);
  trim.input.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(
        panel("Text", source),
        panel("Blank lines between paragraphs", blankLines),
        panel("Spacing", trim)
      ),
      stack(panel("Result", out))
    ),
    foot: actions(copyButton(() => result, "Copy text", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
