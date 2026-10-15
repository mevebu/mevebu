// Turns CSV rows into JSON records, the first row naming the properties.
import { el, bench, stack, panel, textArea, checkbox, notice, output, copyButton, actions, toolcard } from "../core.js";

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

function coerce(value) {
  const text = value ?? "";
  if (text === "") return "";
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  if (text === "true") return true;
  if (text === "false") return false;
  return text;
}

export function mount(slot) {
  const source = textArea({ rows: 12, "aria-label": "CSV", placeholder: "name,role\nAda,engineer" });
  const typedBox = checkbox("Typed values", { checked: true });
  const result = output({ rows: 12 });
  const error = notice("error");
  let current = "[]";

  function run() {
    error.write("");
    const text = source.value;
    if (!text.trim()) {
      current = "[]";
      result.write("[]");
      return;
    }
    const rows = parseDelimited(text, detectDelimiter(text));
    const header = rows[0] ?? [];
    const body = rows.slice(1);
    if (body.some((row) => row.length !== header.length)) {
      error.write("Some rows have a different number of columns.");
    }
    const typed = typedBox.input.checked;
    const records = body.map((row) => {
      const record = {};
      header.forEach((key, i) => {
        const name = key || `column${i + 1}`;
        record[name] = typed ? coerce(row[i]) : (row[i] ?? "");
      });
      return record;
    });
    current = JSON.stringify(records, null, 2);
    result.write(current);
  }

  source.addEventListener("input", run);
  typedBox.input.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(panel("CSV", source), panel(null, typedBox), error),
      stack(panel("JSON", result))
    ),
    foot: actions(copyButton(() => current, "Copy JSON", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
