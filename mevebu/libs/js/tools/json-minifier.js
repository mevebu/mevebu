// Compacts valid JSON and reports the size saved.
import { el, bench, stack, panel, textArea, notice, copyButton, actions, toolcard } from "../core.js";

const bytes = (text) => new TextEncoder().encode(text).length;

const tile = (key, value) =>
  el("div", { class: "mvb-stat" }, el("span", { class: "mvb-stat__v" }, value), el("span", { class: "mvb-stat__k" }, key));

export function mount(slot) {
  const source = textArea({
    rows: 12,
    class: "mvb-in mvb-in--area mvb-in--mono",
    "aria-label": "JSON",
    placeholder: "Paste JSON",
    value: '{\n  "hello": "world",\n  "count": 3\n}',
  });
  const result = textArea({ rows: 12, readonly: true, class: "mvb-in mvb-in--area mvb-in--mono", "aria-label": "Minified JSON" });
  const stats = el("div", { class: "mvb-stats" });
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
    foot: actions(copyButton(() => result.value, "Copy result", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
