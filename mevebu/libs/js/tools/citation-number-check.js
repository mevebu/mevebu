// Checks numbered citations against a reference list.
import { el, bench, stack, panel, textArea, notice, copyButton, actions, toolcard } from "../core.js";

function tile(label) {
  const value = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, "0");
  const node = el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, value, el("span", { class: "text-2xs font-semibold text-ink-3" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

function citedNumbers(text) {
  const set = new Set();
  const re = /\[([0-9,\s-]+)\]/g;
  let match;
  while ((match = re.exec(text))) {
    for (const chunk of match[1].split(",")) {
      const trimmed = chunk.trim();
      if (!trimmed) continue;
      const range = trimmed.split(/\s*-\s*/);
      if (range.length === 2) {
        const a = Number(range[0]);
        const b = Number(range[1]);
        if (Number.isInteger(a) && Number.isInteger(b) && b >= a && b - a < 500) {
          for (let i = a; i <= b; i++) set.add(i);
        }
      } else if (Number.isInteger(Number(trimmed))) {
        set.add(Number(trimmed));
      }
    }
  }
  return set;
}

function referenceNumbers(text) {
  const set = new Set();
  for (const line of text.split(/\r?\n/)) {
    const match = line.trim().match(/^\[?(\d+)\]?[.)\]]?/);
    if (match) set.add(Number(match[1]));
  }
  return set;
}

export function mount(slot) {
  const body = textArea({ rows: 10, "aria-label": "Text with citations", placeholder: "The text, with citations like [1]." });
  const list = textArea({ rows: 10, "aria-label": "Reference list", placeholder: "One reference per line" });
  const citedTile = tile("Cited");
  const refsTile = tile("References");
  const missingTile = tile("Missing");
  const unusedTile = tile("Unused");
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" }, citedTile, refsTile, missingTile, unusedTile);
  const tableWrap = el("div", { class: "max-h-80 overflow-auto" });
  const note = notice("note");
  note.write("A number match does not prove the reference is correct.");
  let report = "";

  function run() {
    const cited = citedNumbers(body.value);
    const refs = referenceNumbers(list.value);
    const missing = [...cited].filter((n) => !refs.has(n)).sort((a, b) => a - b);
    const unused = [...refs].filter((n) => !cited.has(n)).sort((a, b) => a - b);

    citedTile.set(String(cited.size));
    refsTile.set(String(refs.size));
    missingTile.set(String(missing.length));
    unusedTile.set(String(unused.length));

    const rows = [
      ...missing.map((n) => [n, "Cited, no reference"]),
      ...unused.map((n) => [n, "Reference, not cited"])];
    if (!body.value.trim() && !list.value.trim()) {
      tableWrap.replaceChildren(el("p", { class: "border-s-[3px] border-transparent ps-2 text-sm text-ink-3" }, "Paste the text and the reference list."));
    } else if (!rows.length) {
      tableWrap.replaceChildren(el("p", { class: "border-s-[3px] border-transparent ps-2 text-sm text-ink-3" }, "Every number matches."));
    } else {
      tableWrap.replaceChildren(el("table", { class: "w-full border-collapse font-mono text-sm [&_th]:wrap-anywhere [&_td]:wrap-anywhere [&_th]:border-b [&_td]:border-b [&_th]:border-orbit [&_td]:border-orbit [&_th]:px-2.5 [&_td]:px-2.5 [&_th]:py-2 [&_td]:py-2 [&_th]:text-start [&_td]:text-start [&_th]:font-sans [&_th]:text-2xs [&_th]:font-semibold [&_th]:text-ink-2 [&_tbody>tr:last-child>th]:border-b-0 [&_tbody>tr:last-child>td]:border-b-0" },
        el("thead", {}, el("tr", {}, el("th", {}, "Number"), el("th", {}, "Problem"))),
        el("tbody", {}, ...rows.map((row) => el("tr", {},
          el("th", {}, String(row[0])),
          el("td", {}, row[1])
        )))
      ));
    }

    report = [
      ...missing.map((n) => `${n}: cited, no reference`),
      ...unused.map((n) => `${n}: reference, not cited`)].join("\n");
  }

  body.addEventListener("input", run);
  list.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Text with citations", body), panel("Reference list", list), note),
      stack(stats, panel("Problems", tableWrap))
    ),
    foot: actions(copyButton(() => report, "Copy problems", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
