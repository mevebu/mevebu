// Sorts a reference list alphabetically by the start of each line.
import { bench, stack, panel, textArea, selectInput, output, notice, copyButton, actions, toolcard } from "../core.js";

const DIRECTIONS = [
  { value: "az", label: "A to Z" },
  { value: "za", label: "Z to A" },
];

export function mount(slot) {
  const source = textArea({ rows: 12, "aria-label": "References", placeholder: "One reference per line" });
  const direction = selectInput(DIRECTIONS, { value: "az", "aria-label": "Direction" });
  const result = output({ rows: 12 });
  const note = notice("note");
  note.write("References are ordered by the start of each line.");
  let text = "";

  function run() {
    const lines = source.value.split(/\r?\n/).filter((line) => line.trim());
    const sorted = lines
      .slice()
      .sort((a, b) => a.trim().localeCompare(b.trim(), undefined, { sensitivity: "base", numeric: true }));
    if (direction.value === "za") sorted.reverse();
    text = sorted.join("\n");
    result.write(text);
  }

  source.addEventListener("input", run);
  direction.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(panel("References", source), panel("Direction", direction), note),
      stack(panel("Sorted", result))
    ),
    foot: actions(copyButton(() => text, "Copy list", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
