// Builds an APA 7 reference and its in-text citation from source details.
import { bench, stack, panel, textInput, selectInput, output, notice, copyButton, actions, toolcard } from "../core.js";

const TYPES = [
  { value: "book", label: "Book" },
  { value: "article", label: "Journal article" },
  { value: "chapter", label: "Chapter in a book" },
  { value: "web", label: "Web page" },
];

const parts = (raw) => raw.split(";").map((item) => item.trim()).filter(Boolean);
const surname = (author) => author.split(",")[0].trim();

function authorList(raw) {
  const list = parts(raw);
  if (!list.length) return "";
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]}, & ${list[1]}`;
  return `${list.slice(0, -1).join(", ")}, & ${list[list.length - 1]}`;
}

function inText(raw, year) {
  const list = parts(raw);
  const y = year.trim();
  if (!list.length) return y ? `(${y})` : "";
  if (list.length === 1) return `(${surname(list[0])}, ${y})`;
  if (list.length === 2) return `(${surname(list[0])} & ${surname(list[1])}, ${y})`;
  return `(${surname(list[0])} et al., ${y})`;
}

const endDot = (value) => (/[.!?]$/.test(value) ? value : `${value}.`);

export function mount(slot) {
  const type = selectInput(TYPES, { value: "book", "aria-label": "Source type" });
  const authors = textInput({ placeholder: "Smith, J. A.; Doe, B.", "aria-label": "Authors" });
  const year = textInput({ placeholder: "2020", "aria-label": "Year" });
  const title = textInput({ placeholder: "Title of the work", "aria-label": "Title" });
  const source = textInput({ placeholder: "Journal, publisher or site", "aria-label": "Source" });
  const details = textInput({ placeholder: "Volume, issue, pages or edition", "aria-label": "Details" });
  const link = textInput({ placeholder: "https://doi.org/10.0000/abc", "aria-label": "DOI or URL" });

  const reference = output({ rows: 6 });
  const citation = output({ rows: 2 });
  const note = notice("note");
  note.write("Check the details against the source and the APA 7 guide.");
  let refText = "";

  function build() {
    const pieces = [];
    const au = authorList(authors.value);
    const yr = year.value.trim();
    if (au) pieces.push(au);
    if (yr) pieces.push(`(${yr}).`);
    const ti = title.value.trim();
    if (ti) pieces.push(endDot(ti));
    const src = source.value.trim();
    const det = details.value.trim();
    if (type.value === "article") {
      if (src) pieces.push(det ? `${src}, ${det}.` : endDot(src));
    } else {
      if (src) pieces.push(endDot(src));
      if (det) pieces.push(endDot(det));
    }
    if (link.value.trim()) pieces.push(link.value.trim());
    refText = pieces.join(" ");
    reference.write(refText);
    citation.write(inText(authors.value, yr));
  }

  for (const input of [authors, year, title, source, details, link]) input.addEventListener("input", build);
  type.addEventListener("change", build);

  const card = toolcard({
    body: bench(
      stack(
        panel("Source type", type),
        panel("Authors", authors),
        panel("Year", year),
        panel("Title", title),
        panel("Source", source),
        panel("Details", details),
        panel("DOI or URL", link),
        note
      ),
      stack(panel("Reference", reference), panel("In-text citation", citation))
    ),
    foot: actions(
      copyButton(() => citation.textContent, "Copy in-text"),
      copyButton(() => refText, "Copy reference", "fill")
    ),
  });
  slot.append(card.node);
  build();

  return {};
}

export default { mount };
