// Placeholder text by the word, the sentence or the paragraph. The classic
// opening is a checkbox, not a lock-in, and regeneration never clears the copy.
import { toast, copyText, chipRow, numberInput, checkbox, button, bench, stack, panel, textArea, readPin, writePin, actions, toolcard } from "../core.js";

const WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(" ");

const pick = (max) => Math.floor(Math.random() * max);

function sentence() {
  const total = 8 + pick(9);
  const words = Array.from({ length: total }, () => WORDS[pick(WORDS.length)]);
  let line = words.join(" ");
  line = line.charAt(0).toUpperCase() + line.slice(1);
  if (pick(6) === 0) {
    const at = line.indexOf(" ", 12);
    if (at > 0) line = `${line.slice(0, at)},${line.slice(at)}`;
  }
  return `${line}.`;
}

const paragraph = () => Array.from({ length: 3 + pick(4) }, sentence).join(" ");

export function mount(slot) {
  const PIN = "lorem-ipsum";
  const saved = readPin(PIN, { unit: "paragraphs", amount: "3", classic: true });
  let unit = ["words", "sentences", "paragraphs"].includes(saved.unit) ? saved.unit : "paragraphs";

  const chips = chipRow(
    [
      { value: "words", label: "Words" },
      { value: "sentences", label: "Sentences" },
      { value: "paragraphs", label: "Paragraphs" },
    ],
    {
      value: unit,
      label: "Unit",
      onChange: (value) => {
        unit = value;
        generate();
      },
    }
  );
  const amount = numberInput({ value: saved.amount ?? "3", min: "1", max: "200", "aria-label": "How many" });
  const classic = checkbox("Start with the classic opening", { checked: saved.classic !== false });
  const result = textArea({ rows: 12, readonly: true, class: "mvb-in mvb-in--area", "aria-label": "Generated text" });

  function totalCount() {
    return Math.max(1, Math.min(200, parseInt(amount.value || "1", 10) || 1));
  }

  function generate() {
    const total = totalCount();
    let text = "";
    if (unit === "words") text = Array.from({ length: total }, () => WORDS[pick(WORDS.length)]).join(" ");
    else if (unit === "sentences") text = Array.from({ length: total }, sentence).join(" ");
    else text = Array.from({ length: total }, paragraph).join("\n\n");
    if (classic.input.checked && text) {
      text = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, ${text.slice(text.indexOf(" ") + 1)}`;
    }
    result.value = text;
    writePin(PIN, { unit, amount: String(total), classic: classic.input.checked });
  }

  const againButton = button("Make new text", { icon: "refresh-cw", kind: "fill" });
  const copyButton = button("Copy", { icon: "copy" });
  againButton.addEventListener("click", () => {
    amount.value = String(totalCount());
    generate();
  });
  copyButton.addEventListener("click", async () => {
    toast((await copyText(result.value)) ? "Copied" : "Copy failed");
  });
  amount.addEventListener("input", generate);
  amount.addEventListener("change", () => {
    amount.value = String(totalCount());
  });
  classic.input.addEventListener("change", generate);

  const card = toolcard({
    body: bench(
      stack(panel("Unit", chips), panel("How many", amount), classic),
      panel("Text", result)
    ),
    foot: actions(copyButton, againButton),
  });
  slot.append(card.node);
  generate();

  return {};
}

export default { mount };