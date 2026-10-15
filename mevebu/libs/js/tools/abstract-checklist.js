// Checks the usual parts of a research abstract.
import { el, bench, stack, panel, textArea, toggleRow, notice, copyButton, actions, toolcard } from "../core.js";

const PARTS = [
  { value: "background", label: "Background" },
  { value: "aim", label: "Aim" },
  { value: "method", label: "Method" },
  { value: "results", label: "Results" },
  { value: "conclusion", label: "Conclusion" },
];

function tile(label) {
  const value = el("span", { class: "mvb-stat__v" }, "0");
  const node = el("div", { class: "mvb-stat" }, value, el("span", { class: "mvb-stat__k" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

const countWords = (text) => (text.trim() ? text.trim().split(/\s+/).length : 0);

export function mount(slot) {
  const source = textArea({ rows: 12, "aria-label": "Abstract", placeholder: "Paste the abstract" });
  const parts = toggleRow(PARTS.map((part) => ({ ...part, checked: false })));
  const wordsTile = tile("Words");
  const tickedTile = tile("Ticked");
  const stats = el("div", { class: "mvb-stats" }, wordsTile, tickedTile);
  const note = notice("note");
  note.write("This checks structure only, not quality.");
  let summary = "";

  function run() {
    const ticked = parts.values();
    wordsTile.set(String(countWords(source.value)));
    tickedTile.set(String(ticked.length));
    summary = PARTS.map((part) => `${part.label}: ${ticked.includes(part.value) ? "yes" : "no"}`).join("\n");
  }

  source.addEventListener("input", run);
  parts.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(panel("Abstract", source), note),
      stack(stats, panel("Parts found", parts))
    ),
    foot: actions(copyButton(() => summary, "Copy checklist", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
