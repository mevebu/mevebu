// Converts JSON to YAML with a vendored writer. Block style by default, flow
// style on request.
import { bench, stack, panel, textArea, output, notice, chipRow, downloadButton, copyButton, actions, toolcard } from "../core.js";
import { dump } from "../vendor/js-yaml.mjs";

const EXAMPLE = '{\n  "service": "api",\n  "replicas": 2,\n  "ports": [8080, 8443],\n  "labels": { "tier": "backend" }\n}';

export function mount(slot) {
  const source = textArea({ rows: 14, "aria-label": "JSON", value: EXAMPLE });
  const result = output({ tag: "textarea", rows: 12 });
  const error = notice("error");
  let style = "block";

  const chips = chipRow(
    [{ value: "block", label: "Block" }, { value: "flow", label: "Flow" }],
    { value: "block", label: "Style", onChange: (value) => { style = value; run(); } },
  );

  function run() {
    error.write("");
    if (!source.value.trim()) {
      result.value = "";
      return;
    }
    let value;
    try {
      value = JSON.parse(source.value);
    } catch (caught) {
      result.value = "";
      error.write(caught.message);
      return;
    }
    result.value = dump(value, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      flowLevel: style === "flow" ? 0 : -1,
    });
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Style", chips), panel("JSON", source), error),
      stack(panel("YAML", result)),
    ),
    foot: actions(
      downloadButton(() => result.value, "data.yaml", "Download", "text/yaml"),
      copyButton(() => result.value, "Copy YAML", "fill"),
    ),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
