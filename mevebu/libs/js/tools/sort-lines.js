// Sorts a list of lines alphabetically or numerically, either direction.
import { bench, stack, panel, textArea, chipRow, toggleRow, copyButton, actions, toolcard } from "../core.js";

export function mount(slot) {
  const source = textArea({ rows: 12, "aria-label": "Text", placeholder: "Paste your list, one entry per line" });
  const result = textArea({ rows: 12, readonly: true, class: "mvb-in mvb-in--area mvb-in--mono", "aria-label": "Result" });

  let direction = "asc";
  const dirChips = chipRow(
    [{ value: "asc", label: "A to Z" }, { value: "desc", label: "Z to A" }],
    { value: "asc", label: "Direction", onChange: (value) => { direction = value; run(); } }
  );
  const options = toggleRow([
    { value: "ignore", label: "Ignore case", checked: false },
    { value: "numeric", label: "Numeric", checked: false },
  ]);

  function run() {
    const text = source.value;
    if (!text) { result.value = ""; return; }
    const opts = options.values();
    const ignore = opts.includes("ignore");
    const numeric = opts.includes("numeric");
    const collator = new Intl.Collator(undefined, { numeric, sensitivity: ignore ? "base" : "variant" });
    const lines = text.split("\n");
    lines.sort((a, b) => {
      if (numeric) {
        const na = parseFloat(a);
        const nb = parseFloat(b);
        if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;
      }
      return collator.compare(a, b);
    });
    if (direction === "desc") lines.reverse();
    result.value = lines.join("\n");
  }

  source.addEventListener("input", run);
  options.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(panel("Direction", dirChips), options),
      stack(panel("Result", result))
    ),
    foot: actions(copyButton(() => result.value, "Copy result", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
