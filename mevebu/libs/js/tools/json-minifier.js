// Compacts valid JSON and reports the size saved.
import { el, bench, stack, panel, textArea, output, notice, copyButton, actions, toolcard } from "../core.js";

const bytes = (text) => new TextEncoder().encode(text).length;

const tile = (key, value) =>
  el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, value), el("span", { class: "text-2xs font-semibold text-ink-3" }, key));

export function mount(slot) {
  const source = textArea({
    rows: 12,
    "aria-label": "JSON",
    value: '{\n  "hello": "world",\n  "count": 3\n}'});
  const result = output({ tag: "textarea", rows: 12 });
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" });
  const error = notice("error");

  function run() {
    error.write("");
    stats.replaceChildren();
    if (!source.value.trim()) {
      result.value = "";
      return;
    }
    let compact;
    try {
      compact = JSON.stringify(JSON.parse(source.value));
    } catch (caught) {
      result.value = "";
      error.write(caught.message);
      return;
    }
    const before = bytes(source.value);
    const after = bytes(compact);
    const saved = before ? Math.max(0, Math.round((1 - after / before) * 100)) : 0;
    result.value = compact;
    stats.append(tile("Before", `${before} B`), tile("After", `${after} B`), tile("Saved", `${saved}%`));
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("JSON", source), error),
      stack(panel("Minified", result), stats)
    ),
    foot: actions(copyButton(() => result.value, "Copy result", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
