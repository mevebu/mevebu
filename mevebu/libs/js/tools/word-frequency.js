// Ranks the words and phrases a text repeats, so a writer can see the
// distribution instead of only the total count.
import { el, bench, stack, panel, textArea, chipRow, checkbox, notice, copyButton, downloadButton, actions, toolcard, blank } from "../core.js";

const STOP_WORDS = new Set(`a about above after again against all am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves`.split(/\s+/));

const TOKEN = /[\p{L}\p{N}]+(?:['\u2019-][\p{L}\p{N}]+)*/gu;

const escapeCell = (value) => `"${String(value).replaceAll('"', '""')}"`;

export function mount(slot) {
  const source = textArea({ rows: 10, "aria-label": "Text" });
  const phraseChips = chipRow([
    { value: 1, label: "One word" },
    { value: 2, label: "Two words" },
    { value: 3, label: "Three words" },
  ], { value: 1, onChange: run, label: "Phrase length" });
  const ignoreCase = checkbox("Ignore case", { checked: true });
  const skipCommon = checkbox("Skip common words", { checked: true });
  const summary = el("p", { class: "text-sm text-ink-2" }, "Paste text to count what repeats.");
  const table = el("div", { class: "grid gap-1" });
  const empty = blank("chart-line", "The words that repeat most will be listed here.");
  const result = el("div", { class: "grid gap-2" });
  let rows = [];

  function tokens(text) {
    const raw = text.match(TOKEN) ?? [];
    return ignoreCase.input.checked ? raw.map((word) => word.toLocaleLowerCase()) : raw;
  }

  function run() {
    const text = source.value;
    if (!text.trim()) {
      rows = [];
      table.replaceChildren();
      result.replaceChildren(empty);
      summary.textContent = "Paste text to count what repeats.";
      return;
    }
    const size = Number(phraseChips.value ?? 1);
    const words = tokens(text);
    const counts = new Map();
    let total = 0;
    for (let index = 0; index + size <= words.length; index++) {
      const phrase = words.slice(index, index + size).join(" ");
      if (size === 1 && skipCommon.input.checked && STOP_WORDS.has(phrase)) continue;
      counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
      total++;
    }
    rows = [...counts]
      .map(([phrase, count]) => ({ phrase, count, share: total ? (count / total) * 100 : 0 }))
      .sort((left, right) => right.count - left.count || left.phrase.localeCompare(right.phrase))
      .slice(0, 200);

    if (!rows.length) {
      table.replaceChildren();
      result.replaceChildren(blank("chart-line", "Every phrase was a common word. Turn off Skip common words to see them."));
      summary.textContent = "No phrases left after the filter.";
      return;
    }

    result.replaceChildren(el("div", { class: "flex items-baseline justify-between gap-3" },
      el("h2", { class: "text-sm font-semibold text-ink-2" }, size === 1 ? "Words" : "Phrases"),
      el("span", { class: "text-2xs font-semibold text-ink-3 tabular-nums" }, `${rows.length} shown`)), table);
    const most = rows[0].count;
    table.replaceChildren(...rows.map((row) => {
      const bar = el("div", { class: "h-1 rounded-full bg-jade/70", style: `width:${Math.max(2, (row.count / most) * 100)}%` });
      return el("div", { class: "grid gap-1.5 rounded-r1 border border-orbit bg-deck-2 px-3 py-2" },
        el("div", { class: "flex items-baseline justify-between gap-3" },
          el("span", { class: "wrap-anywhere text-sm font-medium" }, row.phrase),
          el("span", { class: "text-2xs font-semibold text-ink-3 tabular-nums" }, `${row.count} · ${row.share.toFixed(1)}%`)),
        bar);
    }));
    const unique = counts.size;
    summary.textContent = `${rows.length} listed from ${unique} distinct ${size === 1 ? "words" : "phrases"}.`;
  }

  function report() {
    return ["Phrase\tCount\tPercent", ...rows.map((row) => `${row.phrase}\t${row.count}\t${row.share.toFixed(1)}%`)].join("\n");
  }

  function csv() {
    return ["Phrase,Count,Percent", ...rows.map((row) => [escapeCell(row.phrase), row.count, row.share.toFixed(1)].join(","))].join("\n");
  }

  source.addEventListener("input", run);
  ignoreCase.input.addEventListener("change", run);
  skipCommon.input.addEventListener("change", run);

  const saveButton = downloadButton(() => rows.length ? csv() : "", "word-frequency.csv", "Save CSV", "text/csv");

  const card = toolcard({
    body: bench(
      stack(
        panel("Text", source, "Counts follow as you type."),
        panel("Phrase length", phraseChips),
        panel("", el("div", { class: "grid gap-1.5" }, ignoreCase, skipCommon)),
      ),
      stack(summary, result),
    ),
    foot: actions(saveButton, copyButton(report, "Copy table", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
