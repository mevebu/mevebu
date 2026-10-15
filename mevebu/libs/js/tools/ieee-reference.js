// Builds an IEEE numbered reference from source details.
import { bench, stack, panel, textInput, numberInput, selectInput, output, notice, copyButton, actions, toolcard } from "../core.js";

const TYPES = [
  { value: "journal", label: "Journal article" },
  { value: "conference", label: "Conference paper" },
  { value: "book", label: "Book" },
];

const parts = (raw) => raw.split(";").map((item) => item.trim()).filter(Boolean);

function flip(author) {
  const bits = author.split(",").map((item) => item.trim());
  return bits.length >= 2 ? `${bits[1]} ${bits[0]}` : author;
}

function authorList(raw) {
  const list = parts(raw).map(flip);
  if (!list.length) return "";
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}`;
}

export function mount(slot) {
  const number = numberInput({ value: "1", min: "1", "aria-label": "Reference number" });
  const type = selectInput(TYPES, { value: "journal", "aria-label": "Source type" });
  const authors = textInput({ placeholder: "Smith, J. A.; Doe, B.", "aria-label": "Authors" });
  const title = textInput({ placeholder: "Title of the work", "aria-label": "Title" });
  const source = textInput({ placeholder: "Journal, conference or publisher", "aria-label": "Source" });
  const details = textInput({ placeholder: "vol. 1, no. 2, pp. 3-4", "aria-label": "Details" });
  const year = textInput({ placeholder: "2020", "aria-label": "Year" });
  const link = textInput({ placeholder: "https://doi.org/10.0000/abc", "aria-label": "DOI or URL" });

  const reference = output({ rows: 6 });
  const citation = output({ rows: 1 });
  const note = notice("note");
  note.write("Check the details against the source and the IEEE guide.");
  let refText = "";

  function build() {
    const n = number.value.trim() || "1";
    const au = authorList(authors.value);
    const ti = title.value.trim();
    const src = source.value.trim();
    const det = details.value.trim();
    const yr = year.value.trim();
    const url = link.value.trim();

    const body = [];
    if (au) body.push(au);
    if (type.value === "book") {
      if (ti) body.push(ti);
      if (src) body.push(src);
      if (det) body.push(det);
    } else {
      if (ti) body.push(`"${ti}"`);
      if (type.value === "conference") {
        if (src) body.push(`in ${src}`);
      } else if (src) {
        body.push(src);
      }
      if (det) body.push(det);
    }
    if (yr) body.push(yr);
    if (url) body.push(url);

    refText = `[${n}] ${body.join(", ")}`;
    if (!/[.!?]$/.test(refText)) refText += ".";
    reference.write(refText);
    citation.write(`[${n}]`);
  }

  for (const input of [number, authors, title, source, details, year, link]) input.addEventListener("input", build);
  type.addEventListener("change", build);

  const card = toolcard({
    body: bench(
      stack(
        panel("Number", number),
        panel("Source type", type),
        panel("Authors", authors),
        panel("Title", title),
        panel("Source", source),
        panel("Details", details),
        panel("Year", year),
        panel("DOI or URL", link),
        note
      ),
      stack(panel("Reference", reference), panel("Bracketed citation", citation))
    ),
    foot: actions(
      copyButton(() => citation.textContent, "Copy number"),
      copyButton(() => refText, "Copy reference", "fill")
    ),
  });
  slot.append(card.node);
  build();

  return {};
}

export default { mount };
