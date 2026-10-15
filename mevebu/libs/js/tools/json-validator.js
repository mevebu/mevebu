// Checks whether JSON parses and names the first error when it does not.
import { bench, stack, panel, textArea, notice, output, copyButton, actions, toolcard } from "../core.js";

function describe(data) {
  if (Array.isArray(data)) return `an array of ${data.length} item${data.length === 1 ? "" : "s"}`;
  if (data === null) return "null";
  if (typeof data === "object") {
    const count = Object.keys(data).length;
    return `an object with ${count} key${count === 1 ? "" : "s"}`;
  }
  return `a ${typeof data}`;
}

export function mount(slot) {
  const source = textArea({ rows: 12, class: "mvb-in mvb-in--area mvb-in--mono", "aria-label": "JSON", placeholder: "Paste JSON" });
  const report = output({ rows: 4 });
  const error = notice("error");

  function run() {
    error.write("");
    if (!source.value.trim()) {
      report.write("");
      return;
    }
    try {
      const data = JSON.parse(source.value);
      report.write(`Valid JSON: ${describe(data)}.`);
    } catch (caught) {
      report.write("");
      error.write(caught.message);
    }
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("JSON", source), error),
      stack(panel("Result", report))
    ),
    foot: actions(copyButton(() => report.textContent, "Copy result", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
