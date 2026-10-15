// Builds a BibTeX entry with a citation key from source details.
import { bench, stack, panel, textInput, selectInput, output, notice, copyButton, downloadButton, actions, toolcard } from "../core.js";

const TYPES = [
  { value: "article", label: "Article" },
  { value: "book", label: "Book" },
  { value: "inproceedings", label: "In proceedings" },
];

const parts = (raw) => raw.split(";").map((item) => item.trim()).filter(Boolean);
const surname = (author) => author.split(",")[0].trim().replace(/[^A-Za-z]/g, "");

function bibAuthors(raw) {
  const list = parts(raw);
  return list.join(" and ");
}

function makeKey(authors, year) {
  const first = parts(authors)[0] ? surname(parts(authors)[0]) : "ref";
  return `${first}${year}`.toLowerCase() || "entry";
}

export function mount(slot) {
  const type = selectInput(TYPES, { value: "article", "aria-label": "Entry type" });
  const key = textInput({ placeholder: "Derived from the first author and year", "aria-label": "Citation key" });
  const authors = textInput({ placeholder: "Smith, J. A.; Doe, B.", "aria-label": "Authors" });
  const title = textInput({ placeholder: "Title of the work", "aria-label": "Title" });
  const year = textInput({ placeholder: "2020", "aria-label": "Year" });
  const container = textInput({ placeholder: "Journal or book title", "aria-label": "Journal or book title" });
  const volume = textInput({ placeholder: "12", "aria-label": "Volume" });
  const pages = textInput({ placeholder: "34-45", "aria-label": "Pages" });
  const publisher = textInput({ placeholder: "Publisher", "aria-label": "Publisher" });
  const doi = textInput({ placeholder: "10.0000/abc", "aria-label": "DOI" });

  const result = output({ rows: 14 });
  const note = notice("note");
  note.write("Check the details against the source and the target style guide.");
  let bibText = "";

  function build() {
    const fields = [];
    const au = bibAuthors(authors.value);
    if (au) fields.push(["author", au]);
    if (title.value.trim()) fields.push(["title", title.value.trim()]);
    if (type.value === "article") {
      if (container.value.trim()) fields.push(["journal", container.value.trim()]);
    } else if (type.value === "inproceedings") {
      if (container.value.trim()) fields.push(["booktitle", container.value.trim()]);
    } else if (publisher.value.trim()) {
      fields.push(["publisher", publisher.value.trim()]);
    }
    if (year.value.trim()) fields.push(["year", year.value.trim()]);
    if (type.value === "article" && volume.value.trim()) fields.push(["volume", volume.value.trim()]);
    if (pages.value.trim()) fields.push(["pages", pages.value.trim()]);
    if (type.value === "inproceedings" && publisher.value.trim()) fields.push(["publisher", publisher.value.trim()]);
    if (doi.value.trim()) fields.push(["doi", doi.value.trim()]);

    const entryKey = key.value.trim() || makeKey(authors.value, year.value.trim());
    const lines = fields.map(([name, value]) => `  ${name} = {${value}},`);
    if (lines.length) lines[lines.length - 1] = lines[lines.length - 1].replace(/,$/, "");
    bibText = [`@${type.value}{${entryKey},`, ...lines, "}"].join("\n");
    result.write(bibText);
  }

  for (const input of [key, authors, title, year, container, volume, pages, publisher, doi]) {
    input.addEventListener("input", build);
  }
  type.addEventListener("change", build);

  const card = toolcard({
    body: bench(
      stack(
        panel("Entry type", type),
        panel("Citation key", key),
        panel("Authors", authors),
        panel("Title", title),
        panel("Year", year),
        panel("Journal or book title", container),
        panel("Volume", volume),
        panel("Pages", pages),
        panel("Publisher", publisher),
        panel("DOI", doi),
        note
      ),
      stack(panel("BibTeX entry", result))
    ),
    foot: actions(
      downloadButton(() => bibText, "reference.bib", "Save .bib", "text/plain"),
      copyButton(() => bibText, "Copy entry", "fill")
    ),
  });
  slot.append(card.node);
  build();

  return {};
}

export default { mount };
