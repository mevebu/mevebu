// Turns pasted table data into a Markdown table.
import { el, bench, stack, panel, textArea, selectInput, notice, output, copyButton, actions, toolcard } from "../core.js";

function parseDelimited(text, delimiter) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += char;
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function detectDelimiter(text) {
  const candidates = [",", ";", "\t", "|"];
  const first = text.split(/\r?\n/)[0] ?? "";
  const counts = { ",": 0, ";": 0, "\t": 0, "|": 0 };
  let quoted = false;
  for (let i = 0; i < first.length; i++) {
    const char = first[i];
    if (char === '"') quoted = !quoted;
    else if (!quoted && char in counts) counts[char]++;
  }
  let best = ",";
  let bestCount = 0;
  for (const candidate of candidates) {
    if (counts[candidate] > bestCount) { bestCount = counts[candidate]; best = candidate; }
  }
  return best;
}

const escapeCell = (cell) => String(cell ?? "").replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ").trim();

function tile(label) {
  const value = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, "0");
  const node = el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, value, el("span", { class: "text-2xs font-semibold text-ink-3" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

export function mount(slot) {
  const source = textArea({ rows: 12, "aria-label": "Table data", placeholder: "Paste rows copied from a spreadsheet" });
  const delimiter = selectInput([
    { value: "auto", label: "Auto" },
    { value: ",", label: "Comma" },
    { value: ";", label: "Semicolon" },
    { value: "\t", label: "Tab" },
    { value: "|", label: "Pipe" }], { value: "auto", "aria-label": "Delimiter" });
  const alignment = selectInput([
    { value: "none", label: "None" },
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" }], { value: "none", "aria-label": "Alignment" });

  const result = output({ rows: 12 });
  const rowsTile = tile("Rows");
  const colsTile = tile("Columns");
  const stats = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" }, rowsTile, colsTile);
  const error = notice("error");
  let current = "";

  function separator(count) {
    const cell = alignment.value === "left" ? ":---" : alignment.value === "center" ? ":---:" : alignment.value === "right" ? "---:" : "---";
    return Array.from({ length: count }, () => cell);
  }

  function run() {
    error.write("");
    const text = source.value;
    if (!text.trim()) {
      current = "";
      result.write("");
      rowsTile.set("0");
      colsTile.set("0");
      return;
    }
    const used = delimiter.value === "auto" ? detectDelimiter(text) : delimiter.value;
    const rows = parseDelimited(text, used);
    const header = rows[0] ?? [];
    const body = rows.slice(1);
    if (body.some((row) => row.length !== header.length)) {
      error.write("Some rows have a different number of columns.");
    }
    rowsTile.set(String(rows.length));
    colsTile.set(String(header.length));
    const line = (cells) => `| ${cells.join(" | ")} |`;
    current = [
      line(header.map(escapeCell)),
      line(separator(header.length)),
      ...body.map((row) => line(header.map((_, i) => escapeCell(row[i]))))].join("\n");
    result.write(current);
  }

  source.addEventListener("input", run);
  delimiter.addEventListener("change", run);
  alignment.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(panel("Table data", source), panel("Delimiter", delimiter), panel("Alignment", alignment), error),
      stack(stats, panel("Markdown", result))
    ),
    foot: actions(copyButton(() => current, "Copy Markdown", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
