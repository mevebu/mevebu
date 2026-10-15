// Builds an MLA 9 works cited entry from source details.
import { bench, stack, panel, textInput, selectInput, output, notice, copyButton, actions, toolcard } from "../core.js";

const TYPES = [
  { value: "book", label: "Book" },
  { value: "article", label: "Journal article" },
  { value: "web", label: "Web page" },
];

const parts = (raw) => raw.split(";").map((item) => item.trim()).filter(Boolean);

function flip(author) {
  const bits = author.split(",").map((item) => item.trim());
  return bits.length >= 2 ? `${bits[1]} ${bits[0]}` : author;
}

function authorList(raw) {
  const list = parts(raw);
  if (!list.length) return "";
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]}, and ${flip(list[1])}`;
  return `${list[0]}, et al.`;
}

export function mount(slot) {
  const type = selectInput(TYPES, { value: "book", "aria-label": "Source type" });
  const authors = textInput({ placeholder: "Smith, John; Doe, Jane", "aria-label": "Authors" });
  const title = textInput({ placeholder: "Title of the work", "aria-label": "Title" });
  const source = textInput({ placeholder: "Publisher, journal or site", "aria-label": "Source" });
  const details = textInput({ placeholder: "Volume, issue, pages", "aria-label": "Details" });
  const year = textInput({ placeholder: "2020", "aria-label": "Year" });
  const link = textInput({ placeholder: "https://example.com", "aria-label": "URL" });

  const entry = output({ rows: 6 });
  const note = notice("note");
  note.write("Check the details against the source and the MLA 9 guide.");
  let refText = "";

  function build() {
    const pieces = [];
    const au = authorList(authors.value);
    if (au) pieces.push(`${au}.`);
    const ti = title.value.trim();
    const src = source.value.trim();
    const det = details.value.trim();
    const yr = year.value.trim();
    const url = link.value.trim();

    if (type.value === "book") {
      if (ti) pieces.push(`${ti}.`);
      const tail = [src, yr].filter(Boolean).join(", ");
      if (tail) pieces.push(`${tail}.`);
    } else if (type.value === "article") {
      if (ti) pieces.push(`"${ti}."`);
      const tail = [src, det, yr].filter(Boolean).join(", ");
      if (tail) pieces.push(`${tail}.`);
    } else {
      if (ti) pieces.push(`"${ti}."`);
      const tail = [src, yr, url].filter(Boolean).join(", ");
      if (tail) pieces.push(`${tail}.`);
    }
    refText = pieces.join(" ");
    entry.write(refText);
  }

  for (const input of [authors, title, source, details, year, link]) input.addEventListener("input", build);
  type.addEventListener("change", build);

  const card = toolcard({
    body: bench(
      stack(
        panel("Source type", type),
        panel("Authors", authors),
        panel("Title", title),
        panel("Source", source),
        panel("Details", details),
        panel("Year", year),
        panel("URL", link),
        note
      ),
      stack(panel("Works cited entry", entry))
    ),
    foot: actions(copyButton(() => refText, "Copy entry", "fill")),
  });
  slot.append(card.node);
  build();

  return {};
}

export default { mount };
