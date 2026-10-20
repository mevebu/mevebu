// Fake survey responses. Each question carries weights, so a dashboard can be
// tested against answers that lean the way real answers lean, not uniform noise.
import {
  el, icon, toast, download, bench, stack, panel, textInput, selectInput,
  numberInput, button, actions, toolcard, blank, notice,
} from "../core.js";
import { toCsv } from "../csv.js";
import { seeded, pick, uuid } from "../random.js";

const TYPES = [
  { value: "scale", label: "Scale 1 to 5" },
  { value: "single", label: "Single choice" },
  { value: "multi", label: "Multiple choice" },
  { value: "text", label: "Short text" },
];

const WORDS = ["clear", "useful", "slow", "confusing", "helpful", "missing", "fast", "solid"];

function weighted(random, options) {
  const total = options.reduce((sum, option) => sum + Math.max(0, option.weight), 0);
  if (total <= 0) return pick(random, options).label;
  let roll = random() * total;
  for (const option of options) {
    roll -= Math.max(0, option.weight);
    if (roll <= 0) return option.label;
  }
  return options[options.length - 1].label;
}

export function mount(slot) {
  let questions = [
    {
      text: "How easy was it to use?",
      type: "scale",
      options: [
        { label: "1", weight: 1 },
        { label: "2", weight: 2 },
        { label: "3", weight: 5 },
        { label: "4", weight: 7 },
        { label: "5", weight: 5 },
      ],
    },
    {
      text: "Which part did you use most?",
      type: "single",
      options: [
        { label: "Convert", weight: 6 },
        { label: "Text", weight: 3 },
        { label: "Data", weight: 2 },
      ],
    },
  ];

  const respondents = numberInput({ min: "1", max: "5000", step: "1", value: "50", "aria-label": "Respondents" });
  const seed = textInput({ value: "mevebu", "aria-label": "Seed", class: "font-mono" });
  const withIds = { input: null };

  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const list = el("div", { class: "grid gap-2" });
  const preview = el("div", { class: "overflow-x-auto rounded-r2 border border-orbit" });
  const empty = blank("clipboard-list", "Add a question to see responses.");

  let table = [];
  let header = [];

  function renderQuestions() {
    list.replaceChildren(
      ...questions.map((question, index) => {
        const optionRows = question.options.map((option, optionIndex) =>
          el("div", { class: "flex items-center gap-2" },
            textInput({
              value: option.label,
              placeholder: `Option ${optionIndex + 1}`,
              "aria-label": `Question ${index + 1} option ${optionIndex + 1}`,
              oninput: (event) => { option.label = event.target.value; run(); },
            }),
            numberInput({
              value: String(option.weight),
              min: "0",
              max: "100",
              "aria-label": `Question ${index + 1} option ${optionIndex + 1} weight`,
              oninput: (event) => { option.weight = Number(event.target.value) || 0; run(); },
            }),
            el("button", {
              class: "inline-flex size-8 flex-none cursor-pointer items-center justify-center rounded-[5px] border-0 bg-transparent text-ink-3 hover:bg-deck hover:text-danger disabled:opacity-40",
              type: "button",
              "aria-label": `Remove option ${optionIndex + 1}`,
              disabled: question.options.length <= 1,
              onclick: () => { question.options.splice(optionIndex, 1); renderQuestions(); run(); },
            }, icon("x", "size-3.5"))));

        return el(
          "section",
          { class: "grid gap-2 rounded-r1 border border-orbit bg-deck-2 p-2.5" },
          el("div", { class: "grid gap-2 [grid-template-columns:minmax(0,1fr)_auto]" },
            textInput({
              value: question.text,
              placeholder: `Question ${index + 1}`,
              "aria-label": `Question ${index + 1}`,
              oninput: (event) => { question.text = event.target.value; run(); },
            }),
            el("button", {
              class: "inline-flex size-9 cursor-pointer items-center justify-center rounded-[5px] border-0 bg-transparent text-ink-3 hover:bg-deck hover:text-danger disabled:opacity-40",
              type: "button",
              "aria-label": `Remove question ${index + 1}`,
              disabled: questions.length === 1,
              onclick: () => { questions.splice(index, 1); renderQuestions(); run(); },
            }, icon("trash", "size-4"))),
          selectInput(TYPES.map((type) => ({ value: type.value, label: type.label })), {
            value: question.type,
            "aria-label": `Question ${index + 1} type`,
            onchange: (event) => { question.type = event.target.value; renderQuestions(); run(); },
          }),
          question.type === "text" ? null : el("div", { class: "grid gap-1.5" },
            el("span", { class: "text-2xs font-semibold tracking-[0.06em] text-ink-3 uppercase" }, "Option and weight"),
            ...optionRows)
        );
      })
    );
  }

  function answer(question, random) {
    if (question.type === "text") {
      return `${pick(random, WORDS)} ${pick(random, WORDS)}`;
    }
    if (question.type === "multi") {
      const chosen = question.options.filter(() => random() < Math.min(0.9, question.options.length ? 0.4 : 0));
      return (chosen.length ? chosen : [pick(random, question.options)]).map((option) => option.label).join(" | ");
    }
    return weighted(random, question.options);
  }

  function run() {
    error.write("");
    const count = Math.max(1, Math.min(5000, Number(respondents.value) || 1));
    const random = seeded(seed.value || "mevebu");
    header = ["respondent_id", "submitted_at", ...questions.map((question) => question.text.trim() || "question")];
    table = Array.from({ length: count }, () => {
      const submitted = new Date(Date.UTC(2026, 0, 1) + Math.floor(random() * 90) * 86400000);
      return [
        uuid(random).slice(0, 8),
        submitted.toISOString().slice(0, 10),
        ...questions.map((question) => answer(question, random)),
      ];
    });
    summary.textContent = `${count} respondent${count === 1 ? "" : "s"} · ${questions.length} question${questions.length === 1 ? "" : "s"} · seed ${seed.value || "mevebu"}`;
    renderPreview();
  }

  function renderPreview() {
    empty.hidden = table.length > 0;
    preview.hidden = table.length === 0;
    if (!table.length) {
      preview.replaceChildren();
      return;
    }
    const shown = table.slice(0, 8);
    const columns = header.length;
    const head = el("div", {
      class: "grid border-b border-orbit bg-deck-2 px-3 py-2 text-2xs font-bold tracking-[0.06em] text-ink-3 uppercase",
      style: `grid-template-columns: repeat(${columns}, minmax(100px, 1fr))`,
    }, ...header.map((cell) => el("span", { class: "truncate" }, cell)));
    const body = shown.map((row) =>
      el("div", {
        class: "grid border-b border-orbit px-3 py-1.5 text-sm last:border-b-0",
        style: `grid-template-columns: repeat(${columns}, minmax(100px, 1fr))`,
      }, ...row.map((cell) => el("span", { class: "truncate font-mono text-2xs text-ink-2" }, cell)))
    );
    preview.replaceChildren(head, ...body);
  }

  respondents.addEventListener("input", run);
  seed.addEventListener("input", run);

  const addQuestion = button("Add question", {
    icon: "plus",
    kind: "quiet",
    onclick: () => {
      questions.push({ text: `Question ${questions.length + 1}`, type: "scale", options: [
        { label: "1", weight: 1 }, { label: "2", weight: 2 }, { label: "3", weight: 5 }, { label: "4", weight: 5 }, { label: "5", weight: 2 },
      ] });
      renderQuestions();
      run();
    },
  });

  const downloadButton = button("Download CSV", {
    icon: "download",
    kind: "fill",
    onclick: () => {
      if (!table.length) return;
      download("responses.csv", toCsv([header, ...table]), "text/csv");
      toast("Responses ready");
    },
  });

  renderQuestions();
  run();

  const shell = toolcard({
    body: bench(
      stack(
        panel("Respondents", respondents),
        panel("Seed", seed),
        el("div", { class: "grid gap-1.5" },
          el("div", { class: "flex items-center justify-between gap-2" },
            el("span", { class: "text-sm font-semibold text-ink-2" }, "Questions"),
            addQuestion),
          list),
        error
      ),
      stack(summary, empty, preview,
        el("p", { class: "m-0 text-2xs leading-[1.6] text-ink-3" },
          "Weights are relative, not percentages. A weight of 7 against 3 means the first answer is about twice as likely."))
    ),
    foot: actions(downloadButton),
  });

  slot.append(shell.node);

  return {};
}

export default { mount };
