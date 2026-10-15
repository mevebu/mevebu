// A question and answer set you can flip through and export.
import { el, toast, blank, bench, stack, row, panel, textInput, textArea, button, copyButton, downloadButton, actions, toolcard, readPin, writePin } from "../core.js";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function mount(slot) {
  const PIN = "flashcard-creator";
  const saved = readPin(PIN, []);
  let cards = Array.isArray(saved) ? saved : [];
  let index = 0;
  let flipped = false;

  const question = textInput({ placeholder: "Question", "aria-label": "Question" });
  const answer = textArea({ rows: 3, placeholder: "Answer", "aria-label": "Answer" });
  const listWrap = el("div", { class: "mvb-scroll" });
  const stats = el("div", { class: "mvb-stats" });
  const face = el("pre", { class: "mvb-out" });
  const faceLabel = el("span", { class: "mvb-field__label" }, "Question");

  const addButton = button("Add card", { icon: "plus", kind: "fill" });
  const flipButton = button("Flip", { icon: "arrow-left-right" });
  const prevButton = button("Previous");
  const nextButton = button("Next");

  const save = () => writePin(PIN, cards);
  const tile = (key, value) => el("div", { class: "mvb-stat" },
    el("span", { class: "mvb-stat__v" }, String(value)),
    el("span", { class: "mvb-stat__k" }, key));

  const textExport = () =>
    cards.map((card, i) => `${i + 1}. Q: ${card.question}\n   A: ${card.answer}`).join("\n\n");

  const jsonExport = () =>
    JSON.stringify(cards.map(({ question: q, answer: a }) => ({ question: q, answer: a })), null, 2);

  function removeButton(card) {
    const node = button("", { icon: "trash", "aria-label": `Remove ${card.question}` });
    node.addEventListener("click", () => {
      cards = cards.filter((entry) => entry.id !== card.id);
      if (index >= cards.length) index = Math.max(0, cards.length - 1);
      save();
      render();
    });
    return node;
  }

  function render() {
    if (!cards.length) {
      face.textContent = "";
      listWrap.replaceChildren(blank("layers", "No cards yet."));
    } else {
      const card = cards[index];
      faceLabel.textContent = flipped ? "Answer" : "Question";
      face.textContent = flipped ? card.answer : card.question;
      listWrap.replaceChildren(el("table", { class: "mvb-ttable" },
        el("tbody", {}, ...cards.map((entry, i) => el("tr", {},
          el("th", {}, `${i + 1}. ${entry.question}`),
          el("td", {}, removeButton(entry)))))));
    }
    stats.replaceChildren(tile("Cards", cards.length), tile("Card", cards.length ? `${index + 1} / ${cards.length}` : "-"));
    flipButton.disabled = !cards.length;
    prevButton.disabled = cards.length < 2;
    nextButton.disabled = cards.length < 2;
  }

  function add() {
    const q = question.value.trim();
    const a = answer.value.trim();
    if (!q || !a) return toast("Add a question and an answer");
    cards.push({ id: uid(), question: q, answer: a });
    question.value = "";
    answer.value = "";
    question.focus();
    index = cards.length - 1;
    flipped = false;
    save();
    render();
  }

  addButton.addEventListener("click", add);
  flipButton.addEventListener("click", () => { flipped = !flipped; render(); });
  prevButton.addEventListener("click", () => {
    if (!cards.length) return;
    index = (index - 1 + cards.length) % cards.length;
    flipped = false;
    render();
  });
  nextButton.addEventListener("click", () => {
    if (!cards.length) return;
    index = (index + 1) % cards.length;
    flipped = false;
    render();
  });

  const card = toolcard({
    body: bench(
      stack(panel("Question", question), panel("Answer", answer)),
      stack(
        stats,
        panel(faceLabel, face),
        row(prevButton, nextButton, flipButton),
        panel("Cards", listWrap)
      )
    ),
    foot: actions(
      copyButton(() => textExport(), "Copy text"),
      downloadButton(() => jsonExport(), "flashcards.json", "Save JSON", "application/json"),
      addButton
    ),
  });
  slot.append(card.node);
  render();

  return {};
}

export default { mount };
