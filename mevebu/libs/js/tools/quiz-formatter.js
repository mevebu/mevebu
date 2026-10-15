// Lays out pasted questions and options, and separates the answer key.
import { bench, stack, panel, textArea, notice, copyButton, actions, toolcard } from "../core.js";

const OPTION = /^[-*]\s+/;
const LETTERS = "ABCDEFGHIJ";

function parse(text) {
  const out = [];
  for (const block of text.split(/\n\s*\n/)) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    if (!lines.length) continue;
    const question = lines.find((line) => !OPTION.test(line));
    if (!question) continue;
    const options = lines
      .filter((line) => OPTION.test(line))
      .map((line) => ({ text: line.replace(OPTION, ""), correct: line.startsWith("*") }));
    out.push({ question: question.replace(/^\d+[.)]\s*/, ""), options });
  }
  return out;
}

export function mount(slot) {
  const source = textArea({
    rows: 14,
    "aria-label": "Questions",
    placeholder: "Question one\n- First option\n- Second option\n* The correct option\n\nQuestion two\n- ..."});
  const quiz = textArea({ rows: 12, readonly: true, "aria-label": "Quiz" });
  const key = textArea({ rows: 12, readonly: true, "aria-label": "Answer key" });
  const error = notice("error");

  function render() {
    const items = source.value.trim() ? parse(source.value) : [];
    if (!items.length) {
      quiz.value = "";
      key.value = "";
      error.write(source.value.trim() ? "No questions found. Put the question on the first line and start each option with - or *." : "");
      return;
    }
    error.write("");
    quiz.value = items.map((item, i) => {
      const head = `${i + 1}. ${item.question}`;
      const body = item.options.map((option, j) => `   ${LETTERS[j] || "?"}. ${option.text}`);
      return [head, ...body].join("\n");
    }).join("\n\n");
    key.value = items.map((item, i) => {
      const at = item.options.findIndex((option) => option.correct);
      return `${i + 1}. ${at >= 0 ? LETTERS[at] : "-"}`;
    }).join("\n");
  }

  source.addEventListener("input", render);

  const card = toolcard({
    body: bench(
      stack(panel("Questions", source), error),
      stack(panel("Quiz", quiz), panel("Answer key", key))
    ),
    foot: actions(
      copyButton(() => key.value, "Copy key"),
      copyButton(() => quiz.value, "Copy quiz", "fill")
    )});
  slot.append(card.node);
  render();

  return {};
}

export default { mount };
