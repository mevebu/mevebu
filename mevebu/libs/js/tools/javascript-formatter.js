// Formats JavaScript by re-indenting its tokens. Strings, templates, regexes
// and comments are kept byte for byte.
import { el, bench, stack, panel, textArea, notice, chipRow, copyButton, actions, toolcard } from "../core.js";
import { tokenize } from "../js-tokens.js";

const CONTROL = new Set(["if", "for", "while", "switch", "catch", "with"]);
const BINARY = new Set([
  "=", "+", "-", "*", "/", "%", "**", "==", "===", "!=", "!==", "<", ">", "<=", ">=",
  "&&", "||", "??", "&", "|", "^", "<<", ">>", ">>>", "+=", "-=", "*=", "/=", "%=",
  "**=", "&=", "|=", "^=", "<<=", ">>=", ">>>=", "&&=", "||=", "??=", "=>",
]);
const NO_SPACE_BEFORE = new Set([")", "]", ",", ";", ".", "?.", "++", "--"]);
const VALUE_TYPES = new Set(["word", "number", "string", "template", "regex"]);

function bracketError(tokens) {
  const stack = [];
  const pairs = { ")": "(", "]": "[", "}": "{" };
  for (const token of tokens) {
    if (token.type !== "punct") continue;
    if ("([{".includes(token.value)) stack.push(token.value);
    else if (")]}".includes(token.value)) {
      if (stack.pop() !== pairs[token.value]) return `Unexpected ${token.value}.`;
    }
  }
  return stack.length ? `Unclosed ${stack[stack.length - 1]}.` : null;
}

function format(source, size) {
  const { tokens, error } = tokenize(source);
  if (error) return { error };
  const balance = bracketError(tokens);
  if (balance) return { error: balance };

  const pad = " ".repeat(size);
  const lines = [];
  let line = "";
  let indent = 0;
  let paren = 0;

  const flush = () => {
    if (line.trim()) lines.push(pad.repeat(indent) + line.trimEnd());
    line = "";
  };
  const add = (text, space = false) => {
    if (space && line && !line.endsWith(" ")) line += " ";
    line += text;
  };
  const nextOf = (index) => tokens[index + 1] ?? null;

  tokens.forEach((token, index) => {
    const prev = tokens[index - 1] ?? null;
    const next = nextOf(index);
    const value = token.value;

    if (token.type === "lineComment") {
      add(value, Boolean(line));
      flush();
      return;
    }
    if (token.type === "blockComment") {
      add(value, Boolean(line));
      if (value.includes("\n")) flush();
      return;
    }

    if (token.type === "punct") {
      if (value === "{") {
        const space = prev && (
          prev.type === "word" || prev.type === "number" || prev.type === "string" ||
          prev.type === "template" || prev.value === ")" || prev.value === "]"
        );
        add("{", space);
        flush();
        indent++;
        return;
      }
      if (value === "}") {
        flush();
        indent = Math.max(0, indent - 1);
        line = "}";
        const keep = next && (
          next.value === ";" || next.value === "," || next.value === ")" ||
          next.value === "]" || next.value === "else" || next.value === "catch" ||
          next.value === "finally" || next.value === "while"
        );
        if (!keep) flush();
        return;
      }
      if (value === ";") {
        add(";");
        if (paren === 0) flush();
        return;
      }
      if (value === "(") {
        const control = prev && prev.type === "word" && CONTROL.has(prev.value);
        add("(", control);
        paren++;
        return;
      }
      if (value === ")") {
        add(")");
        paren = Math.max(0, paren - 1);
        return;
      }
      if (value === "[") { add("["); return; }
      if (value === "]") { add("]"); return; }
      if (value === ",") { add(","); add(" "); return; }
      if (value === ":") {
        add(":");
        add(" ");
        if (line.trimStart().startsWith("case ") || line.trimStart().startsWith("default")) flush();
        return;
      }
      if (value === "?") { add(" ? "); return; }
      if (value === "." || value === "?." || value === "++" || value === "--" || value === "!" || value === "~" || value === "...") {
        add(value);
        return;
      }
      if (BINARY.has(value)) {
        add(` ${value} `);
        return;
      }
      add(value);
      return;
    }

    const needsSpace = prev && (
      VALUE_TYPES.has(prev.type) || prev.value === ")" || prev.value === "]" || prev.value === "}"
    );
    add(value, needsSpace);
  });

  flush();
  return { text: lines.join("\n") };
}

export function mount(slot) {
  const source = textArea({
    rows: 14,
    "aria-label": "JavaScript",
    value: "const greet=(name)=>{if(!name)return 'hello';return `hello ${name}`};\n// keep this comment\nconst list=[1,2,3].map(n=>n*2);",
  });
  const result = textArea({ rows: 14, readonly: true, "aria-label": "Formatted JavaScript" });
  const error = notice("error");
  let size = "2";

  const chips = chipRow(
    [{ value: "2", label: "2 spaces" }, { value: "4", label: "4 spaces" }],
    { value: "2", label: "Indent", onChange: (value) => { size = value; run(); } },
  );

  function run() {
    error.write("");
    if (!source.value.trim()) {
      result.value = "";
      return;
    }
    const output = format(source.value, Number(size));
    if (output.error) {
      result.value = "";
      error.write(output.error);
      return;
    }
    result.value = output.text;
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Indent", chips), panel("JavaScript", source), error),
      stack(panel("Formatted", result)),
    ),
    foot: actions(copyButton(() => result.value, "Copy JavaScript", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
