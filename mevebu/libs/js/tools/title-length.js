// Several titles compared by length, longest first.
import { el, blank, bench, stack, panel, textArea, numberInput, copyButton, actions, toolcard } from "../core.js";

const countWords = (text) => (text.trim() ? text.trim().split(/\s+/).length : 0);

function tile(label) {
  const value = el("span", { class: "mvb-stat__v" }, "0");
  const node = el("div", { class: "mvb-stat" }, value, el("span", { class: "mvb-stat__k" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

export function mount(slot) {
  const source = textArea({ rows: 10, "aria-label": "Titles", placeholder: "One title per line" });
  const limit = numberInput({ min: "0", value: "60", "aria-label": "Character limit" });

  const titlesTile = tile("Titles");
  const overTile = tile("Over the limit");
  const longestTile = tile("Longest");
  const stats = el("div", { class: "mvb-stats" }, titlesTile, overTile, longestTile);

  const listWrap = el("div", { class: "mvb-scroll" });
  let listText = "";

  function run() {
    const cap = parseInt(limit.value, 10) || 0;
    const titles = source.value.split("\n").map((line) => line.trim()).filter(Boolean);
    const items = titles.map((title) => ({ title, chars: title.length, words: countWords(title) }));
    items.sort((a, b) => b.chars - a.chars);

    titlesTile.set(String(items.length));
    overTile.set(String(cap > 0 ? items.filter((item) => item.chars > cap).length : 0));
    longestTile.set(String(items.length ? items[0].chars : 0));

    if (!items.length) {
      listWrap.replaceChildren(blank("type", "No titles yet."));
      listText = "";
      return;
    }

    const rows = items.map((item) => el("tr", {},
      el("th", {}, item.title),
      el("td", {}, cap > 0 && item.chars > cap ? `${item.chars} over` : String(item.chars)),
      el("td", {}, String(item.words))));
    listWrap.replaceChildren(el("table", { class: "mvb-ttable" },
      el("thead", {}, el("tr", {}, el("th", {}, "Title"), el("th", {}, "Characters"), el("th", {}, "Words"))),
      el("tbody", {}, ...rows)));
    listText = items.map((item) => `${item.chars} characters, ${item.words} words  ${item.title}`).join("\n");
  }

  source.addEventListener("input", run);
  limit.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Titles", source), panel("Character limit", limit)),
      stack(stats, panel("By length", listWrap))
    ),
    foot: actions(copyButton(() => listText, "Copy list", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
