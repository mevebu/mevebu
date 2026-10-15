// Formats a direct or indirect quotation with its citation.
import { bench, stack, panel, textArea, textInput, selectInput, output, notice, copyButton, actions, toolcard } from "../core.js";

const MODES = [
  { value: "direct", label: "Direct quote" },
  { value: "paraphrase", label: "Paraphrase" },
];

const parts = (raw) => raw.split(";").map((item) => item.trim()).filter(Boolean);
const surname = (author) => author.split(",")[0].trim();
const countWords = (text) => (text.trim() ? text.trim().split(/\s+/).length : 0);

function inText(raw, year, page) {
  const list = parts(raw);
  const y = year.trim();
  const p = page.trim();
  let who = "";
  if (list.length === 1) who = surname(list[0]);
  else if (list.length === 2) who = `${surname(list[0])} & ${surname(list[1])}`;
  else if (list.length > 2) who = `${surname(list[0])} et al.`;
  return `(${[who, y, p ? `p. ${p}` : ""].filter(Boolean).join(", ")})`;
}

export function mount(slot) {
  const quote = textArea({ rows: 8, "aria-label": "Quotation", placeholder: "Paste the quoted text" });
  const authors = textInput({ placeholder: "Smith, J. A.; Doe, B.", "aria-label": "Authors" });
  const year = textInput({ placeholder: "2020", "aria-label": "Year" });
  const page = textInput({ placeholder: "5", "aria-label": "Page" });
  const mode = selectInput(MODES, { value: "direct", "aria-label": "Mode" });

  const result = output({ rows: 10 });
  const note = notice("note");
  note.write("Check your institution's rules for block quotes and page numbers.");
  let text = "";

  function build() {
    const body = quote.value.trim();
    if (!body) {
      text = "";
      result.write("");
      return;
    }
    const cite = inText(authors.value, year.value, page.value);
    if (mode.value === "paraphrase") {
      text = `${body} ${cite}`.trim();
    } else if (countWords(body) >= 40) {
      text = `${body}\n\n${cite}`.trim();
    } else {
      text = `"${body}" ${cite}`.trim();
    }
    result.write(text);
  }

  for (const input of [quote, authors, year, page]) input.addEventListener("input", build);
  mode.addEventListener("change", build);

  const card = toolcard({
    body: bench(
      stack(
        panel("Quotation", quote),
        panel("Authors", authors),
        panel("Year", year),
        panel("Page", page),
        panel("Mode", mode),
        note
      ),
      stack(panel("Formatted", result))
    ),
    foot: actions(copyButton(() => text, "Copy quote", "fill")),
  });
  slot.append(card.node);
  build();

  return {};
}

export default { mount };
