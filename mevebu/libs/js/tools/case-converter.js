// One text in, every letter case out. Each case is a full row you select,
// which reads faster than a wall of chips and doubles as the result.
import { el, toast, copyText, stack, panel, textArea, readPin, writePin, toolcard } from "../core.js";

const wordsOf = (text) => text
  .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
  .replace(/[_\-.]+/g, " ")
  .replace(/\s+/g, " ")
  .trim()
  .split(" ")
  .filter(Boolean);

const cap = (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

const CASES = [
  ["UPPERCASE", (words) => words.join(" ").toUpperCase()],
  ["lowercase", (words) => words.join(" ").toLowerCase()],
  ["Title Case", (words) => words.map(cap).join(" ")],
  ["Sentence case", (words) => {
    const line = words.join(" ").toLowerCase();
    return line.charAt(0).toUpperCase() + line.slice(1);
  }],
  ["camelCase", (words) => (words[0]?.toLowerCase() ?? "") + words.slice(1).map(cap).join("")],
  ["PascalCase", (words) => words.map(cap).join("")],
  ["snake_case", (words) => words.map((word) => word.toLowerCase()).join("_")],
  ["kebab-case", (words) => words.map((word) => word.toLowerCase()).join("-")],
  ["CONSTANT_CASE", (words) => words.map((word) => word.toUpperCase()).join("_")],
  ["Train-Case", (words) => words.map(cap).join("-")],
];

export function mount(slot) {
  const PIN = "case-converter";
  const saved = readPin(PIN, { input: "Hello world from mevebu", active: "camelCase" });

  const source = textArea({ value: saved.input ?? "", rows: 4, "aria-label": "Text to convert", placeholder: "Type or paste text" });
  const list = el("div", { class: "mvb-cases" });
  let active = CASES.some(([name]) => name === saved.active) ? saved.active : "camelCase";

  function convert() {
    const words = wordsOf(source.value);
    for (const row of list.children) {
      const convertCase = CASES.find(([name]) => name === row.dataset.case)[1];
      const value = words.length ? convertCase(words) : "";
      row.querySelector(".mvb-case__value").textContent = value;
      const on = row.dataset.case === active;
      row.classList.toggle("mvb-on", on);
      row.setAttribute("aria-pressed", String(on));
    }
    writePin(PIN, { input: source.value, active });
  }

  for (const [name] of CASES) {
    const button = el(
      "button",
      {
        class: "mvb-case", type: "button", dataset: { case: name }, "aria-pressed": String(name === active),
        onclick: async () => {
          active = name;
          convert();
          const value = button.querySelector(".mvb-case__value").textContent.trim();
          if (value) toast((await copyText(value)) ? "Copied" : "Copy failed");
        },
      },
      el("span", { class: "mvb-case__name" }, name),
      el("span", { class: "mvb-case__value" })
    );
    list.append(button);
  }

  source.addEventListener("input", convert);

  const card = toolcard({ body: stack(panel("Text", source), panel("Cases", list)) });
  slot.append(card.node);
  convert();

  return {};
}

export default { mount };