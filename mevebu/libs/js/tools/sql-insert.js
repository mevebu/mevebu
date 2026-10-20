// CSV to INSERT statements. Quoting follows the dialect, because Postgres and
// MySQL disagree about backslashes and about boolean literals.
import {
  el, toast, download, bench, stack, panel, selectInput, textInput, checkbox,
  button, actions, toolcard, blank, notice, output,
} from "../core.js";
import { dropzone, baseName, formatBytes } from "../files.js";
import { parseDelimited, detectDelimiter, headerKeys } from "../csv.js";

const DIALECTS = {
  postgres: { label: "PostgreSQL", quote: "'", escape: (v) => v.replace(/'/g, "''"), bool: (v) => (/^(true|1|yes)$/i.test(v) ? "TRUE" : "FALSE") },
  mysql: { label: "MySQL", quote: "'", escape: (v) => v.replace(/\\/g, "\\\\").replace(/'/g, "''"), bool: (v) => (/^(true|1|yes)$/i.test(v) ? "1" : "0") },
  sqlite: { label: "SQLite", quote: "'", escape: (v) => v.replace(/'/g, "''"), bool: (v) => (/^(true|1|yes)$/i.test(v) ? "1" : "0") },
};

export function mount(slot) {
  let file = null;
  let rows = [];
  let header = [];
  let headerTypes = [];

  const tableName = textInput({ value: "my_table", "aria-label": "Table name" });
  const schema = textInput({ placeholder: "public", "aria-label": "Schema" });
  const dialect = selectInput(
    Object.entries(DIALECTS).map(([value, config]) => ({ value, label: config.label })),
    { value: "postgres", "aria-label": "Dialect" }
  );
  const perStatement = selectInput(
    [
      { value: "row", label: "One per row" },
      { value: "batch", label: "One multi row insert" },
    ],
    { value: "row", "aria-label": "Statement shape" }
  );
  const useNulls = checkbox("Empty cells become NULL", { checked: true });
  const truncate = checkbox("Start with TRUNCATE", { checked: false });

  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const result = output({ rows: 14 });
  const empty = blank("database", "Drop a CSV to build the statements.");

  const drop = dropzone({ label: "Drop a CSV here", accept: ".csv,text/csv,text/plain", iconName: "database" });
  const clearButton = button("Clear", { icon: "trash", kind: "quiet" });
  const copyButton = button("Copy SQL", {
    icon: "copy",
    onclick: async () => {
      if (!result.textContent) return;
      try {
        await navigator.clipboard.writeText(result.textContent);
        toast("SQL copied");
      } catch {
        error.write("The clipboard is blocked here. Download the .sql file instead.");
      }
    },
  });
  const downloadButton = button("Download .sql", { icon: "download", kind: "fill" });

  function quote(value, config) {
    if (useNulls.input.checked && value === "") return "NULL";
    return `${config.quote}${config.escape(value)}${config.quote}`;
  }

  function build() {
    if (!rows.length) return "";
    const config = DIALECTS[dialect.value] ?? DIALECTS.postgres;
    const name = tableName.value.trim() || "my_table";
    const prefix = schema.value.trim() ? `${schema.value.trim()}.${name}` : name;
    const columns = header.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(", ");
    const lines = [];

    if (truncate.input.checked) lines.push(`TRUNCATE TABLE ${prefix};`);

    if (perStatement.value === "batch") {
      const values = rows
        .map((row) => `  (${row.map((cell, index) => {
          const columnType = headerTypes[index];
          return columnType === "boolean" ? config.bool(cell) : quote(cell, config);
        }).join(", ")})`)
        .join(",\n");
      lines.push(`INSERT INTO ${prefix} (${columns}) VALUES\n${values};`);
    } else {
      for (const row of rows) {
        const values = row.map((cell, index) => {
          const columnType = headerTypes[index];
          return columnType === "boolean" ? config.bool(cell) : quote(cell, config);
        }).join(", ");
        lines.push(`INSERT INTO ${prefix} (${columns}) VALUES (${values});`);
      }
    }
    return lines.join("\n");
  }

  function detectTypes() {
    headerTypes = header.map((_, index) => {
      const sample = rows.slice(0, 20).map((row) => row[index] ?? "").filter((cell) => cell !== "");
      if (sample.length && sample.every((cell) => /^(true|false|1|0|yes|no)$/i.test(cell))) return "boolean";
      return "text";
    });
  }

  function render() {
    empty.hidden = rows.length > 0;
    result.hidden = rows.length === 0;
    copyButton.disabled = rows.length === 0;
    downloadButton.disabled = rows.length === 0;
    if (!rows.length) {
      summary.textContent = "";
      result.write("");
      return;
    }
    detectTypes();
    const sql = build();
    result.write(sql);
    const bytes = new TextEncoder().encode(sql).length;
    summary.textContent = `${rows.length} row${rows.length === 1 ? "" : "s"} · ${header.length} column${header.length === 1 ? "" : "s"} · ${formatBytes(bytes)} of SQL`;
  }

  async function open(files) {
    const picked = Array.from(files).find((entry) => /\.(csv|tsv|txt)$/i.test(entry.name) || entry.type.startsWith("text/"));
    if (!picked) {
      error.write("That file is not a CSV.");
      return;
    }
    try {
      const text = await picked.text();
      const delimiter = detectDelimiter(text);
      const parsed = parseDelimited(text, delimiter);
      if (parsed.length < 2) throw new Error("A CSV needs a header row and at least one data row.");
      file = picked;
      header = headerKeys(parsed[0]);
      rows = parsed.slice(1).filter((row) => row.some((cell) => cell !== ""));
      error.write("");
      render();
    } catch (caught) {
      error.write(caught?.message || "This file could not be read.");
    }
  }

  drop.onFiles(open);
  tableName.addEventListener("input", render);
  schema.addEventListener("input", render);
  dialect.addEventListener("change", render);
  perStatement.addEventListener("change", render);
  useNulls.input.addEventListener("change", render);
  truncate.input.addEventListener("change", render);

  downloadButton.addEventListener("click", () => {
    if (!rows.length) return;
    download(`${baseName(file?.name || "data")}.sql`, result.textContent, "application/sql");
  });
  clearButton.addEventListener("click", () => {
    file = null;
    rows = [];
    header = [];
    error.write("");
    render();
  });

  render();

  const shell = toolcard({
    body: bench(
      stack(
        drop,
        panel("Table", tableName),
        panel("Schema", schema, "Optional. Leave empty for the default."),
        panel("Dialect", dialect),
        panel("Statement shape", perStatement),
        useNulls,
        truncate,
        error
      ),
      stack(summary, empty, result)
    ),
    foot: actions(clearButton, copyButton, downloadButton),
  });

  slot.append(shell.node);

  return {};
}

export default { mount };
