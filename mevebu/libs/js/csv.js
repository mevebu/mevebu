// CSV reading and writing shared by the data tools. Quoted fields, doubled
// quotes, CRLF, and a delimiter guess, so five tools do not each carry a copy.

export function parseDelimited(text, delimiter = ",") {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
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
  // A trailing blank line is an artefact of the file, not a row.
  if (rows.length && rows[rows.length - 1].every((cell) => cell === "")) rows.pop();
  return rows;
}

export function detectDelimiter(text) {
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
    if (counts[candidate] > bestCount) {
      bestCount = counts[candidate];
      best = candidate;
    }
  }
  return best;
}

const needsQuote = (value) => /[",\n\r]/.test(value) || /^\s|\s$/.test(value);

/** Rows of strings to CSV text. Every field that needs quoting gets it. */
export function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const text = cell === null || cell === undefined ? "" : String(cell);
          return needsQuote(text) ? `"${text.replace(/"/g, '""')}"` : text;
        })
        .join(",")
    )
    .join("\n");
}

/** The header row, with duplicates and blanks made usable as keys. */
export function headerKeys(header) {
  const seen = new Map();
  return header.map((cell, index) => {
    const base = (cell || `column_${index + 1}`).trim() || `column_${index + 1}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count ? `${base}_${count + 1}` : base;
  });
}
