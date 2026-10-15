// Subtitle lines checked against a maximum length, with blank lines tidied.
import { el, blank, bench, stack, panel, textArea, numberInput, notice, output, copyButton, actions, toolcard } from "../core.js";

const isTiming = (line) => line.includes("-->");
const isIndex = (line) => /^\d+$/.test(line.trim());

function tile(label) {
  const value = el("span", { class: "mvb-stat__v" }, "0");
  const node = el("div", { class: "mvb-stat" }, value, el("span", { class: "mvb-stat__k" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

export function mount(slot) {
  const source = textArea({ rows: 12, "aria-label": "Subtitles", placeholder: "Paste subtitle text or SRT" });
  const max = numberInput({ min: "10", max: "120", value: "42", "aria-label": "Maximum line length" });

  const linesTile = tile("Lines");
  const longTile = tile("Long lines");
  const longestTile = tile("Longest");
  const stats = el("div", { class: "mvb-stats" }, linesTile, longTile, longestTile);

  const longWrap = el("div", { class: "mvb-scroll" });
  const out = output({ rows: 10 });
  const note = notice("note");

  let tidied = "";

  function run() {
    const cap = Math.max(1, parseInt(max.value, 10) || 42);
    const raw = source.value.replace(/\r\n?/g, "\n").split("\n");
    const content = raw.filter((line) => line.trim() && !isIndex(line) && !isTiming(line));
    const long = content.filter((line) => line.length > cap);
    const longest = content.reduce((best, line) => Math.max(best, line.length), 0);

    linesTile.set(String(content.length));
    longTile.set(String(long.length));
    longestTile.set(String(longest));
    note.write(long.length ? `${long.length} lines run past ${cap} characters.` : "");

    if (!long.length) {
      longWrap.replaceChildren(blank("film", "No line runs past the limit."));
    } else {
      longWrap.replaceChildren(el("div", { class: "mvb-kv" },
        ...long.map((line) => el("div", { class: "mvb-kv__row" },
          el("span", { class: "mvb-kv__k" }, `${line.length}`),
          el("span", { class: "mvb-kv__v" }, line)))));
    }

    tidied = raw
      .map((line) => line.replace(/\s+$/, ""))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/^\n+|\n+$/g, "");
    out.write(tidied);
  }

  source.addEventListener("input", run);
  max.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Subtitles", source), panel("Maximum line length", max), note),
      stack(stats, panel("Long lines", longWrap), panel("Tidied", out))
    ),
    foot: actions(copyButton(() => tidied, "Copy text", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
