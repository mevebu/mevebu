// A CSV with the columns and the types you describe. The same seed always
// produces the same file, so a fixture can be regenerated when it drifts.
import {
  el, icon, toast, download, bench, stack, panel, textInput, selectInput,
  numberInput, button, actions, toolcard, blank, notice,
} from "../core.js";
import { toCsv } from "../csv.js";

const TYPES = [
  { value: "text", label: "Text" },
  { value: "word", label: "Word" },
  { value: "number", label: "Number" },
  { value: "decimal", label: "Decimal" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email" },
  { value: "uuid", label: "UUID" },
  { value: "choice", label: "Choice list" },
];

const WORDS = [
  "alpha", "bravo", "cedar", "delta", "ember", "field", "grove", "harbor", "ivory", "juniper",
  "kelp", "lumen", "meadow", "north", "orbit", "pine", "quartz", "ridge", "summit", "tide",
  "umber", "vale", "willow", "xenon", "yarrow", "zephyr",
];

/** Mulberry32: a small deterministic generator, so a seed is worth writing down. */
function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}

function uuid(random) {
  const hex = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < 32; i++) {
    if (i === 8 || i === 12 || i === 16 || i === 20) out += "-";
    out += i === 12 ? "4" : hex[Math.floor(random() * 16)];
  }
  return out;
}

function value(type, choices, random, rowIndex) {
  switch (type) {
    case "word":
      return pick(random, WORDS);
    case "number":
      return String(Math.floor(random() * 1000));
    case "decimal":
      return (random() * 100).toFixed(2);
    case "boolean":
      return random() > 0.5 ? "true" : "false";
    case "date": {
      const day = new Date(Date.UTC(2025, 0, 1) + Math.floor(random() * 700) * 86400000);
      return day.toISOString().slice(0, 10);
    }
    case "email":
      return `${pick(random, WORDS)}${rowIndex + 1}@example.com`;
    case "uuid":
      return uuid(random);
    case "choice":
      return choices.length ? pick(random, choices) : "";
    default:
      return `${pick(random, WORDS)} ${pick(random, WORDS)}`;
  }
}

export function mount(slot) {
  let columns = [
    { name: "id", type: "number", choices: "" },
    { name: "name", type: "word", choices: "" },
    { name: "active", type: "boolean", choices: "" },
  ];

  const rows = numberInput({ min: "1", max: "10000", step: "1", value: "50", "aria-label": "Row count" });
  const seed = textInput({ value: "mevebu", "aria-label": "Seed", class: "font-mono" });
  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const list = el("div", { class: "grid gap-2" });
  const preview = el("div", { class: "overflow-x-auto rounded-r2 border border-orbit" });
  const empty = blank("table", "Add a column to see the preview.");

  const addButton = button("Add column", { icon: "plus", kind: "quiet" });
  const generate = button("Generate", { icon: "refresh-cw", kind: "fill" });
  const downloadButton = button("Download CSV", { icon: "download" });

  let table = [];
  let header = [];

  function renderColumns() {
    list.replaceChildren(
      ...columns.map((column, index) =>
        el(
          "div",
          { class: "grid gap-2 rounded-r1 border border-orbit bg-deck-2 p-2 [grid-template-columns:minmax(0,1fr)_auto]" },
          el("div", { class: "grid gap-2 sm:grid-cols-2" },
            textInput({
              value: column.name,
              placeholder: `column_${index + 1}`,
              "aria-label": `Column ${index + 1} name`,
              oninput: (event) => {
                column.name = event.target.value;
                run();
              },
            }),
            selectInput(
              TYPES.map((type) => ({ value: type.value, label: type.label })),
              {
                value: column.type,
                "aria-label": `Column ${index + 1} type`,
                onchange: (event) => {
                  column.type = event.target.value;
                  renderColumns();
                  run();
                },
              }
            ),
            column.type === "choice"
              ? textInput({
                  value: column.choices,
                  placeholder: "red, green, blue",
                  "aria-label": `Column ${index + 1} choices`,
                  class: "sm:col-span-2",
                  oninput: (event) => {
                    column.choices = event.target.value;
                    run();
                  },
                })
              : null),
          el("button", {
            class: "inline-flex size-9 cursor-pointer items-center justify-center self-start rounded-[5px] border-0 bg-transparent text-ink-3 hover:bg-deck hover:text-danger disabled:opacity-40",
            type: "button",
            "aria-label": `Remove column ${index + 1}`,
            disabled: columns.length === 1,
            onclick: () => {
              columns.splice(index, 1);
              renderColumns();
              run();
            },
          }, icon("trash", "size-4"))
        )
      )
    );
  }

  function hashSeed(text) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function renderPreview() {
    empty.hidden = table.length > 0;
    preview.hidden = table.length === 0;
    if (!table.length) {
      preview.replaceChildren();
      return;
    }
    const shown = table.slice(0, 8);
    const head = el("div", {
      class: "grid border-b border-orbit bg-deck-2 px-3 py-2 text-2xs font-bold tracking-[0.06em] text-ink-3 uppercase",
      style: `grid-template-columns: repeat(${header.length}, minmax(110px, 1fr))`,
    }, ...header.map((cell) => el("span", { class: "truncate" }, cell)));

    const body = shown.map((row) =>
      el("div", {
        class: "grid border-b border-orbit px-3 py-1.5 text-sm last:border-b-0",
        style: `grid-template-columns: repeat(${header.length}, minmax(110px, 1fr))`,
      }, ...row.map((cell) => el("span", { class: "truncate font-mono text-2xs text-ink-2" }, cell)))
    );

    preview.replaceChildren(head, ...body);
  }

  function run() {
    error.write("");
    const count = Math.max(1, Math.min(10000, Number(rows.value) || 1));
    const names = columns.map((column, index) => column.name.trim() || `column_${index + 1}`);
    if (new Set(names).size !== names.length) error.write("Two columns share a name, so the CSV will have duplicates.");

    const random = seeded(hashSeed(seed.value || "mevebu"));
    header = names;
    table = Array.from({ length: count }, (_, rowIndex) =>
      columns.map((column) =>
        value(
          column.type,
          column.choices.split(",").map((choice) => choice.trim()).filter(Boolean),
          random,
          rowIndex
        )
      )
    );

    summary.textContent = `${count} row${count === 1 ? "" : "s"} · ${columns.length} column${columns.length === 1 ? "" : "s"} · seed ${seed.value || "mevebu"}`;
    renderPreview();
  }

  addButton.addEventListener("click", () => {
    columns.push({ name: `column_${columns.length + 1}`, type: "text", choices: "" });
    renderColumns();
    run();
  });
  rows.addEventListener("input", run);
  seed.addEventListener("input", run);
  generate.addEventListener("click", () => {
    run();
    toast("Sample rebuilt");
  });
  downloadButton.addEventListener("click", () => {
    if (!table.length) return;
    download("sample.csv", toCsv([header, ...table]), "text/csv");
  });

  renderColumns();
  run();

  const shell = toolcard({
    body: bench(
      stack(
        panel("Rows", rows),
        panel("Seed", seed, "The same seed always makes the same file."),
        el("div", { class: "grid gap-1.5" },
          el("div", { class: "flex items-center justify-between gap-2" },
            el("span", { class: "text-sm font-semibold text-ink-2" }, "Columns"),
            addButton),
          list),
        error
      ),
      stack(summary, empty, preview)
    ),
    foot: actions(generate, downloadButton),
  });

  slot.append(shell.node);

  return {};
}

export default { mount };
