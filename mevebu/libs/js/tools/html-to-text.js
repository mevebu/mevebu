// Strips HTML tags with the browser parser and keeps the readable text.
import { bench, stack, panel, textArea, output, notice, copyButton, actions, toolcard } from "../core.js";

function toText(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body?.textContent ?? "").replace(/\s+/g, " ").trim();
}

export function mount(slot) {
  const source = textArea({ rows: 9, value: "<p>Hello <strong>world</strong></p>", "aria-label": "HTML" });
  const result = output({ value: "", rows: 9 });
  const error = notice("error");
  let text = "";

  function run() {
    error.write("");
    if (!source.value) {
      text = "";
      result.write("");
      return;
    }
    try {
      text = toText(source.value);
      result.write(text);
    } catch {
      text = "";
      result.write("");
      error.write("That HTML could not be read.");
    }
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("HTML", source)),
      stack(panel("Plain text", result), error)
    ),
    foot: actions(copyButton(() => text, "Copy text", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
