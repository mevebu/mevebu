// Renders a subset of Markdown into a preview pane. The source is turned into
// DOM nodes, so nothing in it can inject HTML.
import { el, bench, stack, panel, textArea, copyButton, actions, toolcard } from "../core.js";

const SAFE_URL = /^(https?:|mailto:|#|\/|\.)/i;

const safeUrl = (url) => (SAFE_URL.test(url.trim()) ? url.trim() : null);

function inline(text) {
  const out = [];
  const pattern = /(`([^`]+)`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0;
  let match;
  while ((match = pattern.exec(text))) {
    if (match.index > last) out.push(document.createTextNode(text.slice(last, match.index)));
    if (match[2] != null) out.push(el("code", {}, match[2]));
    else if (match[4] != null) out.push(el("strong", {}, match[4]));
    else if (match[6] != null) out.push(el("em", {}, match[6]));
    else if (match[8] != null) {
      const href = safeUrl(match[9]);
      out.push(href
        ? el("a", { href, target: "_blank", rel: "noopener noreferrer" }, match[8])
        : document.createTextNode(match[8]));
    }
    last = pattern.lastIndex;
  }
  if (last < text.length) out.push(document.createTextNode(text.slice(last)));
  return out;
}

const splitRow = (row) => row.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((cell) => cell.trim());

function blocks(source) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const nodes = [];
  let i = 0;

  const isSeparator = (value) => /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(value);
  const isTableStart = (index) => index + 1 < lines.length && lines[index].includes("|") && isSeparator(lines[index + 1]);
  const isBlockStart = (index) => {
    const line = lines[index];
    return !line.trim() || /^```/.test(line) || /^#{1,6}\s/.test(line) || /^\s*>/.test(line) ||
      /^\s*([-*+]|\d+[.)])\s+/.test(line) || /^\s*([-*_])(\s*\1){2,}\s*$/.test(line) || isTableStart(index);
  };

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const code = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) { code.push(lines[i]); i++; }
      i++;
      nodes.push(el("pre", {}, el("code", { class: fence[1] ? `language-${fence[1]}` : null }, code.join("\n"))));
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      nodes.push(el(`h${heading[1].length}`, {}, ...inline(heading[2].trim())));
      i++;
      continue;
    }

    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      nodes.push(el("hr"));
      i++;
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quote = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) { quote.push(lines[i].replace(/^\s*>\s?/, "")); i++; }
      nodes.push(el("blockquote", {}, el("p", {}, ...inline(quote.join(" ")))));
      continue;
    }

    if (isTableStart(i)) {
      const head = splitRow(line);
      i += 2;
      const table = el("table", {}, el("thead", {}, el("tr", {}, ...head.map((cell) => el("th", {}, ...inline(cell))))));
      const body = el("tbody");
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        body.append(el("tr", {}, ...splitRow(lines[i]).map((cell) => el("td", {}, ...inline(cell)))));
        i++;
      }
      table.append(body);
      nodes.push(table);
      continue;
    }

    if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*([-*+]|\d+[.)])\s+/, ""));
        i++;
      }
      const list = el(ordered ? "ol" : "ul");
      for (const item of items) list.append(el("li", {}, ...inline(item)));
      nodes.push(list);
      continue;
    }

    const paragraph = [line];
    i++;
    while (i < lines.length && !isBlockStart(i)) { paragraph.push(lines[i]); i++; }
    nodes.push(el("p", {}, ...inline(paragraph.join(" "))));
  }
  return nodes;
}

export function mount(slot) {
  const source = textArea({
    rows: 16,
    class: "mvb-in mvb-in--area mvb-in--mono",
    "aria-label": "Markdown",
    value: "# Title\n\nSome **bold**, *italic* and `code`.\n\n- one\n- two\n\n> A quote.\n\n| a | b |\n| --- | --- |\n| 1 | 2 |\n\n```js\nconst x = 1;\n```\n",
  });
  const preview = el("div", { class: "mvb-pane" });

  function run() {
    preview.replaceChildren(...blocks(source.value));
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Markdown", source)),
      stack(panel("Preview", preview))
    ),
    foot: actions(copyButton(() => source.value, "Copy markdown", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
