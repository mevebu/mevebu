// The document a dataset needs before anyone uses it: one row per column, with
// the type, the null count, the distinct count, the range and a sample.
import {
  el, toast, download, bench, stack, panel, button, actions, toolcard, blank,
  notice, output,
} from "../core.js";
import { dropzone, baseName, formatBytes } from "../files.js";
import { parseDelimited, detectDelimiter, headerKeys, toCsv } from "../csv.js";

const TYPE_LABELS = {
  number: "number",
  date: "date",
  boolean: "boolean",
  text: "text",
  empty: "empty",
};

function guessType(values) {
  const sample = values.filter((value) => value !== "");
  if (!sample.length) return "empty";
  if (sample.every((value) => /^-?\d+(\.\d+)?$/.test(value))) return "number";
  if (sample.every((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))) return "date";
  if (sample.every((value) => /^(true|false)$/i.test(value))) return "boolean";
  return "text";
}

function summarise(name, values) {
  const filled = values.filter((value) => value !== "");
  const nulls = values.length - filled.length;
  const distinct = new Set(filled).size;
  const type = guessType(filled);

  let min = "";
  let max = "";
  if (type === "number") {
    const numbers = filled.map(Number);
    min = String(Math.min(...numbers));
    max = String(Math.max(...numbers));
  } else if (type === "date" || type === "text") {
    const sorted = [...filled].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    min = sorted[0] ?? "";
    max = sorted[sorted.length - 1] ?? "";
  }

  const counts = new Map();
  for (const value of filled) counts.set(value, (counts.get(value) ?? 0) + 1);
  const top = [...counts].sort((a, b) => b[1] - a[1])[0];

  return {
    name,
    type,
    nulls,
    distinct,
    min,
    max,
    sample: filled[0] ?? "",
    top: top ? `${top[0]} (${top[1]})` : "",
  };
}

export function mount(slot) {
  let file = null;
  let header = [];
  let rows = [];
  let summaryRows = [];

  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const table = el("div", { class: "overflow-x-auto rounded-r2 border border-orbit" });
  const markdown = output({ rows: 12 });
  const empty = blank("table", "Drop a CSV to describe it.");

  const drop = dropzone({ label: "Drop a CSV here", accept: ".csv,text/csv,text/plain", iconName: "table" });
  const clearButton = button("Clear", { icon: "trash", kind: "quiet" });
  const copyButton = button("Copy Markdown", {
    icon: "copy",
    onclick: async () => {
      if (!markdown.textContent) return;
      try {
        await navigator.clipboard.writeText(markdown.textContent);
        toast("Dictionary copied");
      } catch {
        error.write("The clipboard is blocked here. Download the file instead.");
      }
    },
  });
  const downloadMarkdown = button("Download .md", {
    icon: "download",
    onclick: () => {
      if (!markdown.textContent) return;
      download(`${baseName(file?.name || "data")}-dictionary.md`, markdown.textContent, "text/markdown");
    },
  });
  const downloadCsv = button("Download CSV", { icon: "download", kind: "fill" });

  function renderTable() {
    empty.hidden = summaryRows.length > 0;
    table.hidden = summaryRows.length === 0;
    markdown.hidden = summaryRows.length === 0;
    if (!summaryRows.length) {
      table.replaceChildren();
      markdown.write("");
      summary.textContent = "";
      return;
    }

    const columns = ["Column", "Type", "Nulls", "Distinct", "Min", "Max", "Sample"];
    const head = el("div", {
      class: "grid gap-3 border-b border-orbit bg-deck-2 px-3 py-2 text-2xs font-bold tracking-[0.06em] text-ink-3 uppercase [grid-template-columns:minmax(90px,1fr)_70px_52px_64px_minmax(70px,.9fr)_minmax(70px,.9fr)_minmax(90px,1.1fr)]",
    }, ...columns.map((cell) => el("span", {}, cell)));

    const body = summaryRows.map((row) =>
      el("div", {
        class: "grid gap-3 border-b border-orbit px-3 py-2 text-sm last:border-b-0 [grid-template-columns:minmax(90px,1fr)_70px_52px_64px_minmax(70px,.9fr)_minmax(70px,.9fr)_minmax(90px,1.1fr)]",
      },
        el("span", { class: "truncate font-semibold" }, row.name),
        el("span", { class: "text-2xs text-ink-3" }, TYPE_LABELS[row.type] ?? row.type),
        el("span", { class: "font-mono text-2xs tabular-nums" }, String(row.nulls)),
        el("span", { class: "font-mono text-2xs tabular-nums" }, String(row.distinct)),
        el("span", { class: "truncate font-mono text-2xs" }, row.min),
        el("span", { class: "truncate font-mono text-2xs" }, row.max),
        el("span", { class: "truncate font-mono text-2xs text-ink-3" }, row.sample))
    );

    table.replaceChildren(head, ...body);
  }

  function renderMarkdown() {
    const lines = [
      `| Column | Type | Nulls | Distinct | Min | Max | Sample |`,
      `| --- | --- | ---: | ---: | --- | --- | --- |`,
      ...summaryRows.map((row) =>
        `| ${row.name} | ${row.type} | ${row.nulls} | ${row.distinct} | ${row.min} | ${row.max} | ${row.sample} |`),
    ];
    markdown.write(lines.join("\n"));
  }

  function run() {
    summaryRows = header.map((name, index) => summarise(name, rows.map((row) => row[index] ?? "")));
    const nulls = summaryRows.reduce((total, row) => total + row.nulls, 0);
    summary.textContent = `${rows.length} row${rows.length === 1 ? "" : "s"} · ${header.length} column${header.length === 1 ? "" : "s"} · ${nulls} empty cell${nulls === 1 ? "" : "s"}`;
    renderTable();
    renderMarkdown();
  }

  async function open(files) {
    const picked = Array.from(files).find((entry) => /\.(csv|tsv|txt)$/i.test(entry.name) || entry.type.startsWith("text/"));
    if (!picked) {
      error.write("That file is not a CSV.");
      return;
    }
    try {
      const text = await picked.text();
      const parsed = parseDelimited(text, detectDelimiter(text));
      if (parsed.length < 2) throw new Error("A CSV needs a header row and at least one data row.");
      file = picked;
      header = headerKeys(parsed[0]);
      rows = parsed.slice(1).filter((row) => row.some((cell) => cell !== ""));
      error.write("");
      run();
    } catch (caught) {
      error.write(caught?.message || "This file could not be read.");
    }
  }

  drop.onFiles(open);
  clearButton.addEventListener("click", () => {
    file = null;
    header = [];
    rows = [];
    summaryRows = [];
    error.write("");
    renderTable();
  });
  downloadCsv.addEventListener("click", () => {
    if (!summaryRows.length) return;
    const csv = toCsv([
      ["column", "type", "nulls", "distinct", "min", "max", "sample", "top"],
      ...summaryRows.map((row) => [row.name, row.type, row.nulls, row.distinct, row.min, row.max, row.sample, row.top]),
    ]);
    download(`${baseName(file?.name || "data")}-dictionary.csv`, csv, "text/csv");
  });

  renderTable();

  const shell = toolcard({
    body: bench(
      stack(
        drop,
        panel("What it reports", el("p", { class: "m-0 text-sm leading-[1.6] text-ink-3" },
          "The type it detects, empty cells, distinct values, the smallest and largest value, and one sample. A type can be wrong on a mixed column, so check it before you publish.")),
        error
      ),
      stack(summary, empty, table, markdown)
    ),
    foot: actions(clearButton, copyButton, downloadMarkdown, downloadCsv),
  });

  slot.append(shell.node);

  return {};
}

export default { mount };
