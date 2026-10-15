// Percent-encoding for a single value, following encodeURIComponent. The
// swap button moves the result back into the input for a second round.
import { bench, stack, panel, textArea, output, notice, chipRow, button, copyButton, actions, toolcard } from "../core.js";

export function mount(slot) {
  const source = textArea({ rows: 5, value: "q=hello world&lang=id", "aria-label": "Input" });
  // The encoded text is read, not typed, so it sits on the recessed surface.
  const result = output({ tag: "textarea", rows: 5 });
  result.setAttribute("aria-label", "Result");
  const error = notice("error");
  let mode = "encode";

  const chips = chipRow(
    [{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }],
    { value: "encode", label: "Direction", onChange: (value) => { mode = value; run(); } }
  );

  function run() {
    error.write("");
    try {
      result.value = mode === "encode" ? encodeURIComponent(source.value) : decodeURIComponent(source.value);
    } catch {
      error.write("That input is not valid percent-encoded text.");
    }
  }

  const swapButton = button("Use result as input", { icon: "arrow-left-right" });
  swapButton.addEventListener("click", () => {
    source.value = result.value;
    run();
  });
  const copy = copyButton(() => result.value, "Copy result", "fill");

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Direction", chips), panel("Input", source)),
      stack(panel("Result", result), error)
    ),
    foot: actions(swapButton, copy),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };