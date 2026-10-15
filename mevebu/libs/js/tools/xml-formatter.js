// Reindents an XML document by nesting and reports tags that do not match.
import { bench, stack, panel, textArea, output, notice, chipRow, copyButton, actions, toolcard } from "../core.js";

const TOKEN = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<\/?[^>]+>|[^<]+/g;

const tagName = (token) => {
  const match = token.match(/^<\/?\s*([^\s/>]+)/);
  return match ? match[1] : "";
};

function format(source, unit) {
  const tokens = source.match(TOKEN) ?? [];
  const lines = [];
  const open = [];
  const problems = [];
  let depth = 0;

  for (const raw of tokens) {
    const token = raw.trim();
    if (!token) continue;

    if (token.startsWith("<!--") || token.startsWith("<![CDATA[") || token.startsWith("<?") || token.startsWith("<!")) {
      lines.push(unit.repeat(depth) + token);
    } else if (token.startsWith("</")) {
      const closing = tagName(token);
      const expected = open.pop();
      if (expected !== closing) problems.push(`Closing </${closing}> does not match <${expected ?? "?"}>.`);
      depth = Math.max(0, depth - 1);
      lines.push(unit.repeat(depth) + token);
    } else if (token.endsWith("/>")) {
      lines.push(unit.repeat(depth) + token);
    } else if (token.startsWith("<")) {
      lines.push(unit.repeat(depth) + token);
      open.push(tagName(token));
      depth++;
    } else {
      lines.push(unit.repeat(depth) + token);
    }
  }

  if (open.length) problems.push(`Unclosed: ${open.map((name) => `<${name}>`).join(", ")}.`);
  return { text: lines.join("\n"), problems };
}

export function mount(slot) {
  const source = textArea({ rows: 9, value: "<note><to>you</to><body>hi</body></note>", "aria-label": "XML" });
  const result = output({ value: "", rows: 9 });
  const error = notice("error");
  let unit = "  ";
  let text = "";

  const chips = chipRow(
    [{ value: "  ", label: "2 spaces" }, { value: "    ", label: "4 spaces" }],
    { value: "  ", label: "Indent", onChange: (value) => { unit = value; run(); } }
  );

  function run() {
    if (!source.value) {
      text = "";
      result.write("");
      error.write("");
      return;
    }
    const formatted = format(source.value, unit);
    text = formatted.text;
    result.write(text);
    error.write(formatted.problems.join(" "));
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("XML", source), panel("Indent", chips)),
      stack(panel("Formatted", result), error)
    ),
    foot: actions(copyButton(() => text, "Copy XML", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
