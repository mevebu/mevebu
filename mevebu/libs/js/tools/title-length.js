// Several titles compared by length, longest first.
import { el, blank, bench, stack, panel, textArea, numberInput, copyButton, actions, toolcard } from "../core.js";

const countWords = (text) => (text.trim() ? text.trim().split(/\s+/).length : 0);

function tile(label) {
  const value = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, "0");
  const node = el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, value, el("span", { class: "text-2xs font-semibold text-ink-3" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

export function mount(slot) {
  const source = textArea({ rows: 10, "aria-label": "Titles", placeholder: "One title per line" });
  const limit = numberInput({ min: "0", value: "60", "aria-label": "Character limit" });

  const titlesTile = tile("Titles");
  const overTile = tile("Over the limit");
  const longestTile = tile("Longest");
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" }, titlesTile, overTile, longestTile);

  const listWrap = el("div", { class: "max-h-80 overflow-auto" });
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
    listWrap.replaceChildren(el("table", { class: "w-full border-collapse font-mono text-sm [&_th]:wrap-anywhere [&_td]:wrap-anywhere [&_th]:border-b [&_td]:border-b [&_th]:border-orbit [&_td]:border-orbit [&_th]:px-2.5 [&_td]:px-2.5 [&_th]:py-2 [&_td]:py-2 [&_th]:text-start [&_td]:text-start [&_th]:font-sans [&_th]:text-2xs [&_th]:font-semibold [&_th]:text-ink-2 [&_tbody>tr:last-child>th]:border-b-0 [&_tbody>tr:last-child>td]:border-b-0" },
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
    foot: actions(copyButton(() => listText, "Copy list", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
