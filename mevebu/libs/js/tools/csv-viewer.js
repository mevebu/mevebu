// Reads CSV or delimited text as a table, with row and column counts.
import { el, bench, stack, panel, textArea, selectInput, fileInput, notice, copyButton, button, actions, toolcard } from "../core.js";

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

function tile(label) {
  const value = el("span", { class: "mvb-stat__v" }, "0");
  const node = el("div", { class: "mvb-stat" }, value, el("span", { class: "mvb-stat__k" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

export function mount(slot) {
  const source = textArea({ rows: 12, class: "mvb-in mvb-in--area mvb-in--mono", "aria-label": "CSV", placeholder: "Paste CSV here" });
  const delimiter = selectInput([
    { value: "auto", label: "Auto" },
    { value: ",", label: "Comma" },
    { value: ";", label: "Semicolon" },
    { value: "\t", label: "Tab" },
    { value: "|", label: "Pipe" },
  ], { value: "auto", "aria-label": "Delimiter" });
  const file = fileInput({ accept: ".csv,.tsv,.txt,text/csv", "aria-label": "CSV file" });

  const tableWrap = el("div", { class: "mvb-scroll" });
  const rowsTile = tile("Rows");
  const colsTile = tile("Columns");
  const stats = el("div", { class: "mvb-stats" }, rowsTile, colsTile);
  const error = notice("error");
  let current = [];

  function run() {
    error.write("");
    const text = source.value;
    if (!text.trim()) {
      current = [];
      tableWrap.replaceChildren(el("p", { class: "mvb-note" }, "Paste CSV or choose a file."));
      rowsTile.set("0");
      colsTile.set("0");
      return;
    }
    const used = delimiter.value === "auto" ? detectDelimiter(text) : delimiter.value;
    const rows = parseDelimited(text, used);
    current = rows;
    const header = rows[0] ?? [];
    const body = rows.slice(1);
    if (body.some((row) => row.length !== header.length)) {
      error.write("Some rows have a different number of columns.");
    }
    rowsTile.set(String(body.length));
    colsTile.set(String(header.length));
    tableWrap.replaceChildren(el("table", { class: "mvb-ttable" },
      el("thead", {}, el("tr", {}, ...header.map((cell, i) => el("th", {}, cell || `Column ${i + 1}`)))),
      el("tbody", {}, ...body.map((row) => el("tr", {}, ...header.map((_, i) => el("td", {}, row[i] ?? "")))))
    ));
  }

  file.addEventListener("change", async () => {
    const picked = file.files[0];
    if (!picked) return;
    source.value = await picked.text();
    file.value = "";
    run();
  });

  const clearButton = button("Clear", { icon: "trash" });
  clearButton.addEventListener("click", () => { source.value = ""; run(); });
  delimiter.addEventListener("change", run);
  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("CSV", source), panel("Delimiter", delimiter), panel("CSV file", file), error),
      stack(stats, panel("Table", tableWrap))
    ),
    foot: actions(clearButton, copyButton(() => current.map((row) => row.join("\t")).join("\n"), "Copy table", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
