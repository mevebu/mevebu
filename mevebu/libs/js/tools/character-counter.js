// Character counts that follow the text, with an optional limit and the
// number of characters left.
import { el, bench, stack, panel, textArea, numberInput, notice, button, copyButton, actions, toolcard } from "../core.js";

const chars = (text) => [...text].length;
const withoutSpaces = (text) => [...text.replace(/\s/g, "")].length;

function tile(label) {
  const value = el("span", { class: "mvb-stat__v" }, "0");
  const node = el("div", { class: "mvb-stat" }, value, el("span", { class: "mvb-stat__k" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

export function mount(slot) {
  const source = textArea({ rows: 10, "aria-label": "Text", placeholder: "Type or paste text" });
  const limitField = numberInput({ min: "0", placeholder: "No limit", "aria-label": "Character limit" });

  const totalTile = tile("Characters");
  const noSpaceTile = tile("Without spaces");
  const wordsTile = tile("Words");
  const stats = el("div", { class: "mvb-stats" }, totalTile, noSpaceTile, wordsTile);

  const meter = el("div", { class: "mvb-meter", role: "img", "aria-label": "Character limit" }, el("div", { class: "mvb-meter__fill" }));
  const limitNote = notice("note");
  const fill = meter.querySelector(".mvb-meter__fill");

  let counts = { total: 0, noSpace: 0, words: 0 };

  function summary() {
    return [
      `${counts.total} characters`,
      `${counts.noSpace} without spaces`,
      `${counts.words} words`,
    ].join("\n");
  }

  function run() {
    const text = source.value;
    counts = {
      total: chars(text),
      noSpace: withoutSpaces(text),
      words: text.trim() ? text.trim().split(/\s+/).length : 0,
    };
    totalTile.set(String(counts.total));
    noSpaceTile.set(String(counts.noSpace));
    wordsTile.set(String(counts.words));

    const limit = parseInt(limitField.value, 10) || 0;
    if (limit > 0) {
      const ratio = counts.total / limit;
      fill.style.width = `${Math.min(100, ratio * 100)}%`;
      fill.className = `mvb-meter__fill ${ratio > 1 ? "mvb-weak" : ratio > 0.8 ? "mvb-ok" : "mvb-strong"}`;
      limitNote.write(ratio > 1 ? `${counts.total - limit} over the limit.` : `${limit - counts.total} characters left.`);
    } else {
      fill.style.width = "0%";
      fill.className = "mvb-meter__fill";
      limitNote.write("");
    }
  }

  const clearButton = button("Clear", { icon: "trash" });
  clearButton.addEventListener("click", () => { source.value = ""; run(); });
  limitField.addEventListener("input", run);
  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Text", source), panel("Character limit", limitField)),
      stack(stats, meter, limitNote)
    ),
    foot: actions(clearButton, copyButton(summary, "Copy summary", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
