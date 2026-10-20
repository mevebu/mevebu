// Compacts XML by dropping indentation between tags. CDATA, comments,
// processing instructions and attribute values are copied unchanged.
import { el, bench, stack, panel, textArea, output, notice, copyButton, actions, toolcard } from "../core.js";
import { bytes } from "../js-tokens.js";

const EXAMPLE = '<?xml version="1.0"?>\n<config>\n  <server host="localhost" port="8080">\n    <name>api</name>\n  </server>\n  <note><![CDATA[keep  this  spacing]]></note>\n</config>';

const tile = (key, value) =>
  el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" },
    el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, value),
    el("span", { class: "text-2xs font-semibold text-ink-3" }, key));

function minify(source) {
  let out = "";
  let i = 0;

  while (i < source.length) {
    if (source.startsWith("<![CDATA[", i)) {
      const end = source.indexOf("]]>", i + 9);
      if (end === -1) return { error: "Unclosed CDATA section." };
      out += source.slice(i, end + 3);
      i = end + 3;
      continue;
    }
    if (source.startsWith("<!--", i)) {
      const end = source.indexOf("-->", i + 4);
      if (end === -1) return { error: "Unclosed comment." };
      out += source.slice(i, end + 3);
      i = end + 3;
      continue;
    }
    if (source[i] === "<") {
      let j = i + 1;
      let quote = null;
      while (j < source.length) {
        const ch = source[j];
        if (quote) {
          if (ch === quote) quote = null;
        } else if (ch === '"' || ch === "'") {
          quote = ch;
        } else if (ch === ">") {
          break;
        }
        j++;
      }
      if (j >= source.length) return { error: "Unclosed tag." };
      out += source.slice(i, j + 1);
      i = j + 1;
      continue;
    }

    let j = source.indexOf("<", i);
    if (j === -1) j = source.length;
    const text = source.slice(i, j);
    if (!/^\s+$/.test(text) || !text.includes("\n")) out += text;
    i = j;
  }

  return { text: out };
}

export function mount(slot) {
  const source = textArea({ rows: 14, "aria-label": "XML", value: EXAMPLE });
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
      stack(panel("XML", source), error),
      stack(panel("Minified", result), stats),
    ),
    foot: actions(copyButton(() => result.value, "Copy XML", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
