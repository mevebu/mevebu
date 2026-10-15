// Reindents HTML by nesting depth and flags tags that never close.
import { bench, stack, panel, textArea, notice, chipRow, copyButton, actions, toolcard } from "../core.js";

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

const tagName = (token) => (token.match(/^<\s*\/?\s*([a-zA-Z0-9:-]+)/) || [])[1]?.toLowerCase();

export function mount(slot) {
  const source = textArea({
    rows: 12,
    class: "mvb-in mvb-in--area mvb-in--mono",
    "aria-label": "HTML",
    value: "<div class=\"card\"><h1>Title</h1><p>Text <strong>bold</strong></p><br></div>",
  });
  const result = textArea({ rows: 12, readonly: true, class: "mvb-in mvb-in--area mvb-in--mono", "aria-label": "Formatted HTML" });
  const warn = notice("warn");
  let size = "2";

  const chips = chipRow(
    [{ value: "2", label: "2 spaces" }, { value: "4", label: "4 spaces" }, { value: "0", label: "Tabs" }],
    { value: "2", label: "Indent", onChange: (value) => { size = value; run(); } }
  );

  function run() {
    warn.write("");
    if (!source.value.trim()) {
      result.value = "";
      return;
    }
    const indent = size === "0" ? "\t" : " ".repeat(Number(size));
    const tokens = source.value.replace(/>\s+</g, "><").match(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<[^>]+>|[^<]+/g) || [];
    const lines = [];
    const stack = [];
    for (const raw of tokens) {
      const token = raw.trim();
      if (!token) continue;
      if (token.startsWith("</")) {
        const name = tagName(token);
        const at = stack.lastIndexOf(name);
        if (at !== -1) stack.length = at;
        lines.push(indent.repeat(stack.length) + token);
      } else if (token.startsWith("<!")) {
        lines.push(indent.repeat(stack.length) + token);
      } else if (token.startsWith("<")) {
        const name = tagName(token);
        const self = /\/>$/.test(token) || VOID.has(name);
        lines.push(indent.repeat(stack.length) + token);
        if (!self && name) stack.push(name);
      } else {
        lines.push(indent.repeat(stack.length) + token);
      }
    }
    result.value = lines.join("\n");
    if (stack.length) warn.write(`Never closed: ${[...new Set(stack)].join(", ")}.`);
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Indent", chips), panel("HTML", source), warn),
      stack(panel("Formatted", result))
    ),
    foot: actions(copyButton(() => result.value, "Copy markup", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
