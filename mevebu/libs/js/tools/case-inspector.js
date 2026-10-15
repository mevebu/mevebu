// Names the letter case a text uses and lists every case it could become.
import { el, toast, copyText, bench, stack, panel, textArea, copyButton, actions, toolcard } from "../core.js";

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

function detectCase(text) {
  const t = text.trim();
  if (!t || !/[a-zA-Z]/.test(t)) return "No letters";
  if (/\s/.test(t)) {
    if (t === t.toUpperCase()) return "UPPERCASE";
    if (t === t.toLowerCase()) return "lowercase";
    const words = t.split(/\s+/);
    if (words.every((word) => /^[A-Z]/.test(word))) return "Title Case";
    if (/^[A-Z]/.test(t) && t.slice(1) === t.slice(1).toLowerCase()) return "Sentence case";
    return "Mixed";
  }
  if (/^[A-Z0-9]+(_[A-Z0-9]+)+$/.test(t)) return "CONSTANT_CASE";
  if (/^[a-z0-9]+(_[a-z0-9]+)+$/.test(t)) return "snake_case";
  if (/^[A-Za-z0-9]+(-[A-Za-z0-9]+)+$/.test(t)) {
    if (t === t.toLowerCase()) return "kebab-case";
    return t.split("-").every((word) => /^[A-Z]/.test(word)) ? "Train-Case" : "Mixed";
  }
  if (/^[a-z]+([A-Z][a-z0-9]*)+$/.test(t)) return "camelCase";
  if (/^([A-Z][a-z0-9]*)+$/.test(t)) return "PascalCase";
  if (/^[A-Z]+$/.test(t)) return "UPPERCASE";
  if (/^[a-z]+$/.test(t)) return "lowercase";
  return "Mixed";
}

export function mount(slot) {
  const source = textArea({ rows: 5, value: "helloWorld", "aria-label": "Text", placeholder: "Type or paste text" });
  const detected = el("span", { class: "mvb-kv__v" }, "No letters");
  const kv = el(
    "div",
    { class: "mvb-kv" },
    el("div", { class: "mvb-kv__row" }, el("span", { class: "mvb-kv__k" }, "Detected case"), detected)
  );
  const list = el("div", { class: "mvb-cases" });
  let active = "No letters";

  function detectedValue() {
    const entry = CASES.find(([name]) => name === active);
    return entry ? entry[1](wordsOf(source.value)) : source.value;
  }

  function run() {
    const words = wordsOf(source.value);
    active = detectCase(source.value);
    detected.textContent = active;
    for (const row of list.children) {
      const convert = CASES.find(([name]) => name === row.dataset.case)[1];
      row.querySelector(".mvb-case__value").textContent = words.length ? convert(words) : "";
      const on = row.dataset.case === active;
      row.classList.toggle("mvb-on", on);
      row.setAttribute("aria-pressed", String(on));
    }
  }

  for (const [name] of CASES) {
    const button = el(
      "button",
      {
        class: "mvb-case", type: "button", dataset: { case: name }, "aria-pressed": "false",
        onclick: async () => {
          const value = button.querySelector(".mvb-case__value").textContent.trim();
          if (value) toast((await copyText(value)) ? "Copied" : "Copy failed");
        },
      },
      el("span", { class: "mvb-case__name" }, name),
      el("span", { class: "mvb-case__value" })
    );
    list.append(button);
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Text", source)),
      stack(kv, panel("Cases", list))
    ),
    foot: actions(copyButton(detectedValue, "Copy detected", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
