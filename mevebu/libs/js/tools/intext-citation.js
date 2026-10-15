// Formats an in-text citation in APA, Harvard or MLA form.
import { bench, stack, panel, textInput, selectInput, output, notice, copyButton, actions, toolcard } from "../core.js";

const STYLES = [
  { value: "apa", label: "APA" },
  { value: "harvard", label: "Harvard" },
  { value: "mla", label: "MLA" },
];

const FORMS = [
  { value: "parenthetical", label: "Parenthetical" },
  { value: "narrative", label: "Narrative" },
];

const parts = (raw) => raw.split(";").map((item) => item.trim()).filter(Boolean);
const surname = (author) => author.split(",")[0].trim();

export function mount(slot) {
  const style = selectInput(STYLES, { value: "apa", "aria-label": "Style" });
  const form = selectInput(FORMS, { value: "parenthetical", "aria-label": "Form" });
  const authors = textInput({ placeholder: "Smith, J. A.; Doe, B.", "aria-label": "Authors" });
  const year = textInput({ placeholder: "2020", "aria-label": "Year" });
  const page = textInput({ placeholder: "5", "aria-label": "Page" });

  const result = output({ rows: 3 });
  const note = notice("note");
  note.write("Check the details against the source and the style guide.");
  let text = "";

  function build() {
    const list = parts(authors.value);
    const y = year.value.trim();
    const p = page.value.trim();
    const join = style.value === "harvard" ? " and " : " & ";
    let who = "";
    if (list.length === 1) who = surname(list[0]);
    else if (list.length === 2) who = `${surname(list[0])}${join}${surname(list[1])}`;
    else if (list.length > 2) who = `${surname(list[0])} et al.`;

    if (style.value === "mla") {
      text = form.value === "narrative" ? who : [who, p].filter(Boolean).length ? `(${[who, p].filter(Boolean).join(" ")})` : "";
    } else {
      const yearPart = [y, p ? `p. ${p}` : ""].filter(Boolean).join(", ");
      text = form.value === "narrative"
        ? [who, yearPart ? `(${yearPart})` : ""].filter(Boolean).join(" ")
        : `(${[who, y, p ? `p. ${p}` : ""].filter(Boolean).join(", ")})`;
      if (text === "()") text = "";
    }
    result.write(text);
  }

  for (const input of [authors, year, page]) input.addEventListener("input", build);
  for (const select of [style, form]) select.addEventListener("change", build);

  const card = toolcard({
    body: bench(
      stack(
        panel("Style", style),
        panel("Form", form),
        panel("Authors", authors),
        panel("Year", year),
        panel("Page", page),
        note
      ),
      stack(panel("Citation", result))
    ),
    foot: actions(copyButton(() => text, "Copy citation", "fill")),
  });
  slot.append(card.node);
  build();

  return {};
}

export default { mount };
