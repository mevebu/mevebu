// Checks a reference for the usual parts.
import { el, bench, stack, panel, textArea, notice, copyButton, actions, toolcard } from "../core.js";

const PARTS = ["Author", "Year", "Title", "Source"];

function kvRow(key) {
  const value = el("span", { class: "mvb-kv__v" }, "-");
  const row = el("div", { class: "mvb-kv__row" }, el("span", { class: "mvb-kv__k" }, key), value);
  return { row, value };
}

function check(text) {
  const t = text.trim();
  return {
    Author: /^[A-Z][A-Za-z'’.-]+,/.test(t) || /\b(and|&)\s+[A-Z]/.test(t),
    Year: /\b(1[5-9]\d{2}|20\d{2})\b/.test(t),
    Title: /["“][^"”]{2,}["”]/.test(t) || t.replace(/^[^.]*\./, "").trim().length > 8,
    Source: /https?:\/\/|www\.|\bIn\b|\b(Journal|Press|Publishing|Publishers|University|vol\.|pp\.|ed\.)\b/i.test(t),
  };
}

export function mount(slot) {
  const source = textArea({ rows: 6, "aria-label": "Reference", placeholder: "Paste one reference" });
  const rows = {};
  const kv = el("div", { class: "mvb-kv" });
  for (const key of PARTS) {
    rows[key] = kvRow(key);
    kv.append(rows[key].row);
  }
  const status = notice("note");
  const note = notice("note");
  note.write("A complete reference is not proof the source is real.");
  let summary = "";

  function run() {
    const hasText = source.value.trim() !== "";
    const found = check(source.value);
    const missing = [];
    for (const key of PARTS) {
      rows[key].value.textContent = hasText ? (found[key] ? "Found" : "Missing") : "-";
      if (hasText && !found[key]) missing.push(key);
    }
    status.write(hasText ? (missing.length ? `Missing: ${missing.join(", ")}.` : "All four parts found.") : "");
    summary = hasText ? PARTS.map((key) => `${key}: ${found[key] ? "found" : "missing"}`).join("\n") : "";
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Reference", source), note),
      stack(panel("Parts", kv), status)
    ),
    foot: actions(copyButton(() => summary, "Copy check", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
