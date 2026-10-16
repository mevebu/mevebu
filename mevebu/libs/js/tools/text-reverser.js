// Reverses text by character, word or line. Character mode keeps emoji and
// accented letters whole when the browser exposes grapheme segmentation.
import { bench, stack, panel, textArea, output, chipRow, copyButton, actions, toolcard } from "../core.js";

function reverseChars(text) {
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return [...segmenter.segment(text)].map((part) => part.segment).reverse().join("");
  }
  return [...text].reverse().join("");
}

const reverseWords = (text) => text.trim() ? text.trim().split(/\s+/).reverse().join(" ") : "";
const reverseLines = (text) => text ? text.split("\n").reverse().join("\n") : "";

export function mount(slot) {
  const source = textArea({ rows: 10, "aria-label": "Text" });
  const result = output({ tag: "textarea", rows: 10 });

  let mode = "chars";
  const chips = chipRow(
    [
      { value: "chars", label: "Characters" },
      { value: "words", label: "Words" },
      { value: "lines", label: "Lines" }],
    { value: "chars", label: "Reverse by", onChange: (value) => { mode = value; run(); } }
  );

  function run() {
    const text = source.value;
    if (!text) { result.value = ""; return; }
    result.value = mode === "chars" ? reverseChars(text) : mode === "words" ? reverseWords(text) : reverseLines(text);
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Text", source), panel("Reverse by", chips)),
      stack(panel("Result", result))
    ),
    foot: actions(copyButton(() => result.value, "Copy result", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
