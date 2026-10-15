// Formats CSS: selectors on their own line, one property per line.
import { bench, stack, panel, textArea, chipRow, copyButton, actions, toolcard } from "../core.js";

const clean = (text) => text.trim().replace(/\s*\n\s*/g, " ");

function format(css, size) {
  const pad = " ".repeat(size);
  const lines = [];
  let depth = 0;
  let buffer = "";
  let i = 0;
  const push = (line) => { if (line) lines.push(pad.repeat(depth) + line); };

  while (i < css.length) {
    const ch = css[i];
    if (ch === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      const comment = css.slice(i, end === -1 ? css.length : end + 2);
      const before = clean(buffer);
      if (before) { push(before); buffer = ""; }
      push(comment);
      i = end === -1 ? css.length : end + 2;
      continue;
    }
    if (ch === "{") {
      push(`${clean(buffer)} {`);
      buffer = "";
      depth++;
    } else if (ch === "}") {
      const decl = clean(buffer);
      if (decl) push(decl.endsWith(";") ? decl : `${decl};`);
      buffer = "";
      depth = Math.max(0, depth - 1);
      push("}");
      lines.push("");
    } else if (ch === ";") {
      const decl = clean(buffer);
      if (decl) push(`${decl};`);
      buffer = "";
    } else {
      buffer += ch;
    }
    i++;
  }
  const rest = clean(buffer);
  if (rest) push(rest);
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function mount(slot) {
  const source = textArea({
    rows: 12,
    class: "mvb-in mvb-in--area mvb-in--mono",
    "aria-label": "CSS",
    value: ".card{color:red;padding:10px 12px}.card:hover{color:blue}",
  });
  const result = textArea({ rows: 12, readonly: true, class: "mvb-in mvb-in--area mvb-in--mono", "aria-label": "Formatted CSS" });
  let size = "2";

  const chips = chipRow(
    [{ value: "2", label: "2 spaces" }, { value: "4", label: "4 spaces" }],
    { value: "2", label: "Indent", onChange: (value) => { size = value; run(); } }
  );

  function run() {
    result.value = source.value.trim() ? format(source.value, Number(size)) : "";
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Indent", chips), panel("CSS", source)),
      stack(panel("Formatted", result))
    ),
    foot: actions(copyButton(() => result.value, "Copy CSS", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
