// Turns JSON records into CSV, using the object keys as the column names.
import { el, bench, stack, panel, textArea, notice, output, copyButton, downloadButton, actions, toolcard } from "../core.js";

function stringifyCSV(rows, delimiter) {
  return rows.map((row) => row.map((cell) => {
    const value = cell == null ? "" : String(cell);
    const needsQuote = value.includes(delimiter) || /["\n\r]/.test(value) || value !== value.trim();
    return needsQuote ? `"${value.replace(/"/g, '""')}"` : value;
  }).join(delimiter)).join("\n");
}

export function mount(slot) {
  const source = textArea({ rows: 12, "aria-label": "JSON", placeholder: '[{"name":"Ada","role":"engineer"}]' });
  const result = output({ rows: 12 });
  const error = notice("error");
  let current = "";

  function run() {
    error.write("");
    const text = source.value;
    if (!text.trim()) {
      current = "";
      result.write("");
      return;
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch (caught) {
      current = "";
      result.write("");
      error.write(caught.message);
      return;
    }
    const records = Array.isArray(data) ? data : [data];
    if (!records.length || records.some((record) => !record || typeof record !== "object" || Array.isArray(record))) {
      current = "";
      result.write("");
      error.write("Paste an array of objects.");
      return;
    }
    const header = [...new Set(records.flatMap((record) => Object.keys(record)))];
    const rows = [
      header,
      ...records.map((record) => header.map((key) => {
        const value = record[key];
        return value && typeof value === "object" ? JSON.stringify(value) : value;
      }))];
    current = stringifyCSV(rows, ",");
    result.write(current);
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("JSON", source), error),
      stack(panel("CSV", result))
    ),
    foot: actions(
      downloadButton(() => current, "data.csv", "Download CSV", "text/csv"),
      copyButton(() => current, "Copy CSV", "fill")
    )});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
