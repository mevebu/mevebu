// Collects the details of one source in a single form.
import { bench, stack, panel, textInput, selectInput, output, notice, copyButton, actions, toolcard } from "../core.js";

const TYPES = [
  { value: "journal", label: "Journal article" },
  { value: "book", label: "Book" },
  { value: "chapter", label: "Chapter" },
  { value: "conference", label: "Conference paper" },
  { value: "web", label: "Web page" },
  { value: "report", label: "Report" },
];

export function mount(slot) {
  const type = selectInput(TYPES, { value: "journal", "aria-label": "Source type" });
  const authors = textInput({ placeholder: "Smith, J. A.; Doe, B.", "aria-label": "Authors" });
  const year = textInput({ placeholder: "2020", "aria-label": "Year" });
  const title = textInput({ placeholder: "Title", "aria-label": "Title" });
  const container = textInput({ placeholder: "Journal, book or site", "aria-label": "Container" });
  const volume = textInput({ placeholder: "12", "aria-label": "Volume" });
  const issue = textInput({ placeholder: "3", "aria-label": "Issue" });
  const pages = textInput({ placeholder: "34-45", "aria-label": "Pages" });
  const publisher = textInput({ placeholder: "Publisher", "aria-label": "Publisher" });
  const doi = textInput({ placeholder: "10.0000/abc", "aria-label": "DOI" });
  const url = textInput({ placeholder: "https://example.com", "aria-label": "URL" });

  const result = output({ rows: 14 });
  const note = notice("note");
  note.write("Check the details against the source before you cite it.");
  let jsonText = "";

  function collect() {
    const fields = {
      type: type.value,
      authors: authors.value.trim(),
      year: year.value.trim(),
      title: title.value.trim(),
      container: container.value.trim(),
      volume: volume.value.trim(),
      issue: issue.value.trim(),
      pages: pages.value.trim(),
      publisher: publisher.value.trim(),
      doi: doi.value.trim(),
      url: url.value.trim(),
    };
    return Object.fromEntries(Object.entries(fields).filter(([, value]) => value));
  }

  function build() {
    jsonText = JSON.stringify(collect(), null, 2);
    result.write(jsonText);
  }

  const plain = () => Object.entries(collect()).map(([key, value]) => `${key}: ${value}`).join("\n");

  for (const input of [authors, year, title, container, volume, issue, pages, publisher, doi, url]) {
    input.addEventListener("input", build);
  }
  type.addEventListener("change", build);

  const card = toolcard({
    body: bench(
      stack(
        panel("Source type", type),
        panel("Authors", authors),
        panel("Year", year),
        panel("Title", title),
        panel("Container", container),
        panel("Volume", volume),
        panel("Issue", issue),
        panel("Pages", pages),
        panel("Publisher", publisher),
        panel("DOI", doi),
        panel("URL", url),
        note
      ),
      stack(panel("Details", result))
    ),
    foot: actions(
      copyButton(plain, "Copy as text"),
      copyButton(() => jsonText, "Copy JSON", "fill")
    ),
  });
  slot.append(card.node);
  build();

  return {};
}

export default { mount };
