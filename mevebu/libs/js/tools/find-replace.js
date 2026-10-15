// Find and replace, plain text or a regular expression, with a live match count.
import { bench, stack, panel, textArea, textInput, toggleRow, notice, button, copyButton, actions, toolcard } from "../core.js";

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function mount(slot) {
  const source = textArea({ rows: 9, "aria-label": "Text", placeholder: "Paste your text" });
  const findField = textInput({ placeholder: "Find", "aria-label": "Find" });
  const replaceField = textInput({ placeholder: "Replace with", "aria-label": "Replace with" });
  const options = toggleRow([
    { value: "regex", label: "Regex", checked: false },
    { value: "ignore", label: "Ignore case", checked: false }]);
  const result = textArea({ rows: 9, readonly: true, "aria-label": "Result" });
  const error = notice("error");
  const countNote = notice("note");

  function build(global) {
    const find = findField.value;
    if (!find) return null;
    const opts = options.values();
    const flags = (global ? "g" : "") + (opts.includes("ignore") ? "i" : "");
    try {
      return new RegExp(opts.includes("regex") ? find : escapeRegExp(find), flags);
    } catch {
      return "error";
    }
  }

  function run() {
    const pattern = build(true);
    if (pattern === "error") {
      error.write("That pattern is not valid.");
      countNote.write("");
      result.value = source.value;
      return;
    }
    error.write("");
    if (!pattern) {
      countNote.write("");
      result.value = source.value;
      return;
    }
    const matches = source.value.match(pattern) || [];
    result.value = source.value.replace(pattern, replaceField.value);
    countNote.write(matches.length === 1 ? "1 match." : `${matches.length} matches.`);
  }

  function replaceOne() {
    const pattern = build(false);
    if (pattern === "error") return;
    if (!pattern) return;
    source.value = source.value.replace(pattern, replaceField.value);
    run();
  }

  function replaceAll() {
    const pattern = build(true);
    if (pattern === "error") return;
    if (!pattern) return;
    source.value = source.value.replace(pattern, replaceField.value);
    run();
  }

  const replaceOneButton = button("Replace one", { icon: "replace" });
  replaceOneButton.addEventListener("click", replaceOne);
  const replaceAllButton = button("Replace all", { icon: "replace", kind: "fill" });
  replaceAllButton.addEventListener("click", replaceAll);

  source.addEventListener("input", run);
  findField.addEventListener("input", run);
  replaceField.addEventListener("input", run);
  options.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(panel("Text", source), panel("Find", findField), panel("Replace with", replaceField), options, error, countNote),
      stack(panel("Result", result))
    ),
    foot: actions(copyButton(() => result.value, "Copy result"), replaceOneButton, replaceAllButton)});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
