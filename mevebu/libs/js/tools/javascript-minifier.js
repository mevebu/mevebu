// Removes comments and redundant whitespace from JavaScript, without renaming
// anything or changing the meaning of a statement.
import { el, bench, stack, panel, textArea, output, notice, copyButton, actions, toolcard } from "../core.js";
import { tokenize, bytes } from "../js-tokens.js";

const VALUE_TYPES = new Set(["word", "number", "string", "template", "regex"]);
const ASI_WORDS = new Set(["return", "throw", "break", "continue", "yield"]);
const RISKY_START = new Set(["(", "[", "`", "+", "-", "/"]);

const tile = (key, value) =>
  el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" },
    el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, value),
    el("span", { class: "text-2xs font-semibold text-ink-3" }, key));

function keepComment(value) {
  return value.startsWith("/*!") || value.startsWith("//!") || /@license|@preserve/.test(value);
}

function minify(source) {
  const { tokens, error } = tokenize(source);
  if (error) return { error };

  let out = "";
  let previous = null;

  const emit = (text) => { out += text; };

  tokens.forEach((token) => {
    if (token.type === "lineComment" || token.type === "blockComment") {
      if (keepComment(token.value)) {
        if (out && !out.endsWith("\n")) emit("\n");
        emit(token.value);
        if (token.type === "lineComment") emit("\n");
      }
      return;
    }

    if (previous) {
      const newline = token.newline && (
        (previous.type === "word" && ASI_WORDS.has(previous.value)) ||
        (RISKY_START.has(token.value) && (
          VALUE_TYPES.has(previous.type) || [")", "]", "}", "++", "--"].includes(previous.value)
        ))
      );
      if (newline) {
        emit("\n");
        emit(token.value);
        previous = token;
        return;
      }

      const wordPair = VALUE_TYPES.has(previous.type) && VALUE_TYPES.has(token.type);
      const plusPair = ["+", "++"].includes(previous.value) && ["+", "++"].includes(token.value);
      const minusPair = ["-", "--"].includes(previous.value) && ["-", "--"].includes(token.value);
      const commentStart = previous.value === "/" && ["/", "*"].includes(token.value);
      if (wordPair || plusPair || minusPair || commentStart) emit(" ");
    }

    emit(token.value);
    previous = token;
  });

  return { text: out.trim() };
}

export function mount(slot) {
  const source = textArea({
    rows: 14,
    "aria-label": "JavaScript",
    value: "// greeting\nconst greet = (name) => {\n  if (!name) return 'hello';\n  return `hello ${name}`;\n};\n\nconst list = [1, 2, 3].map((n) => n * 2);",
  });
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
    const output = minify(source.value);
    if (output.error) {
      result.value = "";
      error.write(output.error);
      return;
    }
    const before = bytes(source.value);
    const after = bytes(output.text);
    const saved = before ? Math.max(0, Math.round((1 - after / before) * 100)) : 0;
    result.value = output.text;
    stats.append(tile("Before", `${before} B`), tile("After", `${after} B`), tile("Saved", `${saved}%`));
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("JavaScript", source), error),
      stack(panel("Minified", result), stats),
    ),
    foot: actions(copyButton(() => result.value, "Copy result", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
