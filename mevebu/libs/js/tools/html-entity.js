// Encodes special characters as HTML entities, or decodes them back.
import { bench, stack, panel, textArea, notice, chipRow, copyButton, actions, toolcard } from "../core.js";

const ENCODE = [["&", "&amp;"], ["<", "&lt;"], [">", "&gt;"], ['"', "&quot;"], ["'", "&#39;"]];

const encode = (text) => ENCODE.reduce((out, [char, entity]) => out.split(char).join(entity), text);

function decode(text) {
  const area = document.createElement("textarea");
  area.innerHTML = text;
  return area.value;
}

export function mount(slot) {
  const source = textArea({ rows: 6, value: "<a href=\"/x\">Tom & Jerry</a>", "aria-label": "Input" });
  const result = textArea({ rows: 6, readonly: true, "aria-label": "Result" });
  const error = notice("error");
  let mode = "encode";

  const chips = chipRow(
    [{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }],
    { value: "encode", label: "Direction", onChange: (value) => { mode = value; run(); } }
  );

  function run() {
    error.write("");
    if (!source.value) {
      result.value = "";
      return;
    }
    result.value = mode === "encode" ? encode(source.value) : decode(source.value);
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Direction", chips), panel("Input", source), error),
      stack(panel("Result", result))
    ),
    foot: actions(copyButton(() => result.value, "Copy result", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
