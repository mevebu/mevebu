// Swaps one delimiter for another, keeping quoted fields intact.
import { el, bench, stack, panel, textArea, selectInput, notice, output, copyButton, actions, toolcard } from "../core.js";

const OPTIONS = [
  { value: ",", label: "Comma" },
  { value: ";", label: "Semicolon" },
  { value: "\t", label: "Tab" },
  { value: "|", label: "Pipe" },
];

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

function stringifyCSV(rows, delimiter) {
  return rows.map((row) => row.map((cell) => {
    const value = cell == null ? "" : String(cell);
    const needsQuote = value.includes(delimiter) || /["\n\r]/.test(value) || value !== value.trim();
    return needsQuote ? `"${value.replace(/"/g, '""')}"` : value;
  }).join(delimiter)).join("\n");
}

export function mount(slot) {
  const source = textArea({ rows: 12, class: "mvb-in mvb-in--area mvb-in--mono", "aria-label": "Data", placeholder: "Paste delimited data here" });
  const from = selectInput([{ value: "auto", label: "Auto" }, ...OPTIONS], { value: "auto", "aria-label": "Current delimiter" });
  const to = selectInput(OPTIONS, { value: ";", "aria-label": "New delimiter" });
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
    const used = from.value === "auto" ? detectDelimiter(text) : from.value;
    const rows = parseDelimited(text, used);
    current = stringifyCSV(rows, to.value);
    result.write(current);
  }

  source.addEventListener("input", run);
  from.addEventListener("change", run);
  to.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(panel("Data", source), panel("From", from), panel("To", to), error),
      stack(panel("Result", result))
    ),
    foot: actions(copyButton(() => current, "Copy result", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
