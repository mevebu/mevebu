// Turns a title into a URL slug: lowercase, punctuation removed, words joined
// by the chosen separator.
import { bench, stack, panel, textInput, chipRow, copyButton, actions, toolcard } from "../core.js";

function slugify(text, sep) {
  const base = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return sep === "-" ? base : base.replace(/-/g, sep);
}

export function mount(slot) {
  const source = textInput({ value: "Hello mevebu world", "aria-label": "Title" });
  const result = textInput({ readonly: true, mono: true, "aria-label": "Slug" });

  let sep = "-";
  const chips = chipRow(
    [
      { value: "-", label: "Hyphen" },
      { value: "_", label: "Underscore" },
      { value: ".", label: "Dot" }],
    { value: "-", label: "Separator", onChange: (value) => { sep = value; run(); } }
  );

  function run() {
    result.value = slugify(source.value, sep);
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Title", source), panel("Separator", chips)),
      stack(panel("Slug", result))
    ),
    foot: actions(copyButton(() => result.value, "Copy slug", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
