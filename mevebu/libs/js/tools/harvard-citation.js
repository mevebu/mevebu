// Builds a Harvard style reference and its in-text citation from source details.
import { bench, stack, panel, textInput, selectInput, output, notice, copyButton, actions, toolcard } from "../core.js";

const TYPES = [
  { value: "book", label: "Book" },
  { value: "article", label: "Journal article" },
  { value: "web", label: "Web page" },
];

const parts = (raw) => raw.split(";").map((item) => item.trim()).filter(Boolean);
const surname = (author) => author.split(",")[0].trim();

function authorList(raw) {
  const list = parts(raw);
  if (!list.length) return "";
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list[0]} et al.`;
}

function inText(raw, year) {
  const list = parts(raw);
  const y = year.trim();
  if (!list.length) return y ? `(${y})` : "";
  if (list.length === 1) return `(${surname(list[0])}, ${y})`;
  if (list.length === 2) return `(${surname(list[0])} and ${surname(list[1])}, ${y})`;
  return `(${surname(list[0])} et al., ${y})`;
}

export function mount(slot) {
  const type = selectInput(TYPES, { value: "book", "aria-label": "Source type" });
  const authors = textInput({ placeholder: "Smith, J.; Doe, B.", "aria-label": "Authors" });
  const year = textInput({ placeholder: "2020", "aria-label": "Year" });
  const title = textInput({ placeholder: "Title of the work", "aria-label": "Title" });
  const source = textInput({ placeholder: "Publisher, journal or site", "aria-label": "Source" });
  const details = textInput({ placeholder: "Volume, issue, pages", "aria-label": "Details" });
  const link = textInput({ placeholder: "https://example.com", "aria-label": "URL" });

  const reference = output({ rows: 6 });
  const citation = output({ rows: 2 });
  const note = notice("note");
  note.write("Harvard rules differ between institutions. Check yours and the source.");
  let refText = "";

  function build() {
    const au = authorList(authors.value);
    const yr = year.value.trim();
    const ti = title.value.trim();
    const src = source.value.trim();
    const det = details.value.trim();
    const url = link.value.trim();
    const head = [au, yr ? `(${yr})` : ""].filter(Boolean).join(" ");

    const tail = [src, det].filter(Boolean).join(", ");
    const body = type.value === "article" ? [ti ? `'${ti}'` : "", tail, url] : [ti, tail, url];
    refText = [head, ...body].filter(Boolean).join(" ").trim();
    if (refText && !/[.!?]$/.test(refText)) refText += ".";
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
        panel("URL", link),
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
