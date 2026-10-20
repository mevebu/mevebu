// Converts YAML to JSON with a vendored parser. Anchors are resolved and the
// key order is kept.
import { bench, stack, panel, textArea, output, notice, downloadButton, copyButton, actions, toolcard } from "../core.js";
import { load } from "../vendor/js-yaml.mjs";

const EXAMPLE = "service: api\nreplicas: 2\nports:\n  - 8080\n  - 8443\nlabels:\n  tier: backend";

export function mount(slot) {
  const source = textArea({ rows: 14, "aria-label": "YAML", value: EXAMPLE });
  const result = output({ tag: "textarea", rows: 12 });
  const error = notice("error");
  function run() {
    error.write("");
    if (!source.value.trim()) {
      result.value = "";
      return;
    }
    try {
      result.value = JSON.stringify(load(source.value), null, 2);
    } catch (caught) {
      result.value = "";
      const line = caught.mark?.line;
      const where = typeof line === "number" ? `Line ${line + 1}: ` : "";
      error.write(`${where}${caught.reason ?? caught.message}`);
    }
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("YAML", source), error),
      stack(panel("JSON", result)),
    ),
    foot: actions(
      downloadButton(() => result.value, "data.json", "Download", "application/json"),
      copyButton(() => result.value, "Copy JSON", "fill"),
    ),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
