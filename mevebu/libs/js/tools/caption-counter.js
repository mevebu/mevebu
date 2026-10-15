// A caption checked against a character limit, with the room left.
import { el, bench, stack, panel, textArea, numberInput, notice, copyButton, actions, toolcard } from "../core.js";

function tile(label) {
  const value = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, "0");
  const node = el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, value, el("span", { class: "text-2xs font-semibold text-ink-3" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

export function mount(slot) {
  const source = textArea({ rows: 8, "aria-label": "Caption", placeholder: "Type or paste the caption" });
  const limit = numberInput({ min: "0", placeholder: "No limit", "aria-label": "Character limit" });

  const charsTile = tile("Characters");
  const wordsTile = tile("Words");
  const linesTile = tile("Lines");
  const leftTile = tile("Left");
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" }, charsTile, wordsTile, linesTile, leftTile);
  const note = notice("note");

  let summary = "";

  function run() {
    const text = source.value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text ? text.split("\n").length : 0;
    charsTile.set(String(chars));
    wordsTile.set(String(words));
    linesTile.set(String(lines));

    const cap = parseInt(limit.value, 10) || 0;
    if (cap > 0) {
      leftTile.set(String(cap - chars));
      note.write(chars > cap ? `${chars - cap} characters over the limit.` : "");
    } else {
      leftTile.set("-");
      note.write("");
    }

    summary = [
      `${chars} characters`,
      `${words} words`,
      `${lines} lines`,
      cap > 0 ? `${cap - chars} left of ${cap}` : "No limit set"].join("\n");
  }

  source.addEventListener("input", run);
  limit.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Caption", source), panel("Character limit", limit)),
      stack(stats, note)
    ),
    foot: actions(copyButton(() => summary, "Copy summary", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
