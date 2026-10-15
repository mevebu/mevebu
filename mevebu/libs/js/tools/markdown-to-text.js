// Removes Markdown syntax and keeps the words.
import { bench, stack, panel, textArea, output, notice, copyButton, actions, toolcard } from "../core.js";

function toText(markdown) {
  let text = markdown;
  text = text.replace(/```[^\n]*\n?/g, "");
  text = text.replace(/`([^`]+)`/g, "$1");
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  text = text.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  text = text.replace(/^\s{0,3}>\s?/gm, "");
  text = text.replace(/^\s{0,3}[-*+]\s+/gm, "");
  text = text.replace(/^\s{0,3}\d+\.\s+/gm, "");
  text = text.replace(/^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/gm, "");
  text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");
  text = text.replace(/(\*|_)(.*?)\1/g, "$2");
  text = text.replace(/~~(.*?)~~/g, "$1");
  return text.replace(/\s+/g, " ").trim();
}

export function mount(slot) {
  const source = textArea({ rows: 9, value: "## Title\n\nSome **bold** and [a link](https://example.com).", "aria-label": "Markdown" });
  const result = output({ value: "", rows: 9 });
  const error = notice("error");
  let text = "";

  function run() {
    error.write("");
    text = source.value ? toText(source.value) : "";
    result.write(text);
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Markdown", source)),
      stack(panel("Plain text", result), error)
    ),
    foot: actions(copyButton(() => text, "Copy text", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
