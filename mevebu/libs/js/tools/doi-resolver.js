// Cleans a DOI and writes its resolver link.
import { el, bench, stack, panel, textInput, notice, copyButton, actions, toolcard } from "../core.js";

function kvRow(key) {
  const value = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const row = el("div", { class: "grid gap-3 bg-deck px-3 py-[9px] [grid-template-columns:minmax(90px,34%)_minmax(0,1fr)]" }, el("span", { class: "wrap-anywhere text-2xs font-semibold text-ink-2" }, key), value);
  return { row, value };
}

const clean = (raw) =>
  raw
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .trim();

export function mount(slot) {
  const input = textInput({ placeholder: "10.1000/xyz or https://doi.org/10.1000/xyz", "aria-label": "DOI" });
  const doiRow = kvRow("Cleaned DOI");
  const linkRow = kvRow("Resolver URL");
  const kv = el("div", { class: "grid gap-px overflow-hidden rounded-r1 border border-orbit bg-orbit" }, doiRow.row, linkRow.row);
  const error = notice("error");
  const note = notice("note");
  note.write("A matching pattern does not prove the DOI is registered.");
  let link = "";

  function run() {
    const cleaned = clean(input.value);
    if (!input.value.trim()) {
      error.write("");
      doiRow.value.textContent = "-";
      linkRow.value.textContent = "-";
      link = "";
      return;
    }
    if (!/^10\.\d{4,9}\/\S+$/.test(cleaned)) {
      error.write("That does not look like a DOI.");
      doiRow.value.textContent = cleaned || "-";
      linkRow.value.textContent = "-";
      link = "";
      return;
    }
    error.write("");
    doiRow.value.textContent = cleaned;
    link = `https://doi.org/${cleaned}`;
    linkRow.value.textContent = link;
  }

  input.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("DOI", input), note, error),
      stack(panel("Result", kv))
    ),
    foot: actions(
      copyButton(() => doiRow.value.textContent, "Copy DOI"),
      copyButton(() => link, "Copy link", "fill")
    )});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
