// Pretty-prints or compacts JSON and points at the error when it is invalid.
import { bench, stack, panel, textArea, notice, chipRow, copyButton, actions, toolcard } from "../core.js";

export function mount(slot) {
  const source = textArea({
    rows: 12,
    "aria-label": "JSON",
    placeholder: "Paste JSON",
    value: '{"hello":"world","count":3,"items":[1,2,3]}'});
  const result = textArea({ rows: 12, readonly: true, "aria-label": "Result" });
  const error = notice("error");
  let indent = "2";

  const chips = chipRow(
    [{ value: "2", label: "2 spaces" }, { value: "4", label: "4 spaces" }, { value: "0", label: "Compact" }],
    { value: "2", label: "Indent", onChange: (value) => { indent = value; run(); } }
  );

  function run() {
    error.write("");
    if (!source.value.trim()) {
      result.value = "";
      return;
    }
    try {
      const data = JSON.parse(source.value);
      result.value = indent === "0" ? JSON.stringify(data) : JSON.stringify(data, null, Number(indent));
    } catch (caught) {
      result.value = "";
      error.write(caught.message);
    }
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Indent", chips), panel("JSON", source), error),
      stack(panel("Result", result))
    ),
    foot: actions(copyButton(() => result.value, "Copy result", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
