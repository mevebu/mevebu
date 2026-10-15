// Fake people and addresses for testing. Names and places come from bundled
// lists, emails always use the reserved example domain, and cards are masked.
import { el, toast, copyText, download, randomInt, chipRow, numberInput, button, bench, stack, panel, output, actions, toolcard } from "../core.js";

const FIRST = ["Ana", "Budi", "Citra", "Dimas", "Elena", "Fajar", "Gita", "Hendra", "Ingrid", "Joko", "Kira", "Lina", "Marco", "Nadia", "Omar", "Putri", "Quinn", "Rani", "Sandro", "Tara"];
const LAST = ["Ortega", "Wijaya", "Santos", "Kimura", "Novak", "Haddad", "Silva", "Andersen", "Costa", "Pratama", "Rossi", "Meyer", "Fernandez", "Yusuf", "Kowalski"];
const PLACES = [
  ["Jakarta", "ID", "+62"], ["Bandung", "ID", "+62"], ["Madrid", "ES", "+34"], ["Barcelona", "ES", "+34"],
  ["Austin", "US", "+1"], ["Seattle", "US", "+1"], ["Berlin", "DE", "+49"], ["Munich", "DE", "+49"],
  ["Osaka", "JP", "+81"], ["Tokyo", "JP", "+81"], ["Recife", "BR", "+55"], ["Lagos", "NG", "+234"]];
const pick = (list) => list[randomInt(list.length)];

function person(id) {
  const first = pick(FIRST);
  const last = pick(LAST);
  const [city, country, code] = pick(PLACES);
  const handle = `${first}.${last}`.toLowerCase().replace(/[^a-z]/g, "") + (10 + randomInt(90));
  return {
    id,
    name: `${first} ${last}`,
    email: `${handle}@example.test`,
    phone: `${code} ${700 + randomInt(300)} ${1000000 + randomInt(8999999)}`,
    city,
    country,
    card: `4${String(randomInt(1000)).padStart(3, "0")} … ${1000 + randomInt(9000)}`};
}

export function mount(slot) {
  let format = "json";
  const countField = numberInput({ value: "5", min: "1", max: "200", "aria-label": "How many records" });
  const chips = chipRow(
    [
      { value: "json", label: "JSON" },
      { value: "csv", label: "CSV" },
      { value: "table", label: "Table" }],
    { value: "json", label: "Format", onChange: (value) => { format = value; render(); } }
  );
  const text = output({ rows: 14 });
  const table = el("div", { class: "max-h-80 overflow-auto" });
  let rows = [];

  function totalCount() {
    return Math.max(1, Math.min(200, parseInt(countField.value || "1", 10) || 1));
  }

  /** The same rows as the table, tab separated. */
  function tsv() {
    const columns = Object.keys(rows[0] ?? {});
    return [
      columns.join("\t"),
      ...rows.map((row) => columns.map((key) => String(row[key])).join("\t"))].join("\n");
  }

  function render() {
    const total = totalCount();
    rows = Array.from({ length: total }, (_, i) => person(i + 1));
    const columns = Object.keys(rows[0]);
    text.hidden = format === "table";
    table.hidden = format !== "table";
    if (format === "json") {
      text.write(JSON.stringify(rows, null, 2));
    } else if (format === "csv") {
      const escape = (value) => `"${String(value).replaceAll('"', '""')}"`;
      text.write([columns.join(","), ...rows.map((row) => columns.map((key) => escape(row[key])).join(","))].join("\n"));
    } else {
      const body = el("tbody");
      for (const record of rows) {
        const line = el("tr");
        for (const key of columns) line.append(el("td", {}, String(record[key])));
        body.append(line);
      }
      const head = el("tr");
      for (const key of columns) head.append(el("th", {}, key));
      table.replaceChildren(el("table", { class: "w-full border-collapse font-mono text-sm [&_th]:wrap-anywhere [&_td]:wrap-anywhere [&_th]:border-b [&_td]:border-b [&_th]:border-orbit [&_td]:border-orbit [&_th]:px-2.5 [&_td]:px-2.5 [&_th]:py-2 [&_td]:py-2 [&_th]:text-start [&_td]:text-start [&_th]:font-sans [&_th]:text-2xs [&_th]:font-semibold [&_th]:text-ink-2 [&_tbody>tr:last-child>th]:border-b-0 [&_tbody>tr:last-child>td]:border-b-0" }, el("thead", {}, head), body));
    }
  }

  const againButton = button("Make new set", { icon: "refresh-cw", kind: "fill" });
  const copyButton = button("Copy", { icon: "copy" });
  const saveButton = button("Download", { icon: "download" });

  againButton.addEventListener("click", () => {
    countField.value = String(totalCount());
    render();
  });
  countField.addEventListener("input", render);
  countField.addEventListener("change", () => {
    countField.value = String(totalCount());
  });
  copyButton.addEventListener("click", async () => {
    // In table mode the visible table is what gets copied, as tab separated text
    // so it lands in a spreadsheet as a table. The local name here used to shadow
    // the readout above, which threw before the copy ever ran.
    const payload = format === "table" ? tsv() : text.textContent;
    toast((await copyText(payload)) ? "Copied" : "Copy failed");
  });
  saveButton.addEventListener("click", () => {
    if (format === "csv") download("test-data.csv", text.textContent, "text/csv");
    else download("test-data.json", format === "json" ? text.textContent : JSON.stringify(rows, null, 2), "application/json");
  });

  const card = toolcard({
    body: bench(
      stack(panel("Format", chips), panel("Records", countField)),
      el("div", { class: "grid content-start gap-4" }, text, table)
    ),
    foot: actions(copyButton, saveButton, againButton)});
  slot.append(card.node);
  render();

  return {};
}

export default { mount };