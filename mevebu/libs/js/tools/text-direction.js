// Preview text under each direction, with the attribute to use.
import { el, bench, stack, panel, textArea, chipRow, output, copyButton, actions, toolcard } from "../core.js";

const RTL = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0780-\u07BF\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const LTR = /[A-Za-z\u00C0-\u024F]/;

function detect(text) {
  for (const char of text) {
    if (RTL.test(char)) return "rtl";
    if (LTR.test(char)) return "ltr";
  }
  return "ltr";
}

export function mount(slot) {
  const source = textArea({ rows: 6, "aria-label": "Text", placeholder: "Type or paste text" });
  const sample = el("div", { class: "mvb-preview__sample" }, "Sample text");
  const code = output();

  let mode = "auto";
  const dirChips = chipRow(
    [
      { value: "auto", label: "Auto" },
      { value: "ltr", label: "Left to right" },
      { value: "rtl", label: "Right to left" },
    ],
    { value: "auto", label: "Direction", onChange: (next) => { mode = next; run(); } }
  );

  let snippet = "";

  function run() {
    const direction = mode === "auto" ? detect(source.value) : mode;
    sample.dir = direction;
    sample.textContent = source.value.trim() ? source.value : "Sample text";
    snippet = `dir="${direction}"`;
    code.write(snippet);
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Text", source), panel("Direction", dirChips)),
      stack(panel("Preview", sample), panel("Attribute", code))
    ),
    foot: actions(copyButton(() => snippet, "Copy attribute", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
