// The JSON an endpoint returns, written once and reused as a fixture. Fields are
// defined in a small table, and the same definition can be shown as a list with
// pagination, a single item, or an error.
import {
  el, icon, toast, download, bench, stack, panel, textInput, selectInput,
  numberInput, button, actions, toolcard, blank, notice, output, chipRow,
} from "../core.js";
import { seeded, pick, uuid } from "../random.js";

const TYPES = [
  { value: "text", label: "Text" },
  { value: "word", label: "Word" },
  { value: "number", label: "Number" },
  { value: "decimal", label: "Decimal" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email" },
  { value: "uuid", label: "UUID" },
];

const WORDS = ["north", "cedar", "orbit", "summit", "tide", "willow", "ember", "quartz"];

function value(type, random, index) {
  switch (type) {
    case "word": return pick(random, WORDS);
    case "number": return Math.floor(random() * 5000);
    case "decimal": return Number((random() * 200).toFixed(2));
    case "boolean": return random() > 0.5;
    case "date": return new Date(Date.UTC(2025, 0, 1) + Math.floor(random() * 6e10)).toISOString();
    case "email": return `${pick(random, WORDS)}${index + 1}@example.com`;
    case "uuid": return uuid(random);
    default: return `${pick(random, WORDS)} ${pick(random, WORDS)}`;
  }
}

export function mount(slot) {
  let fields = [
    { name: "id", type: "uuid" },
    { name: "title", type: "text" },
    { name: "price", type: "decimal" },
    { name: "in_stock", type: "boolean" },
    { name: "created_at", type: "date" },
  ];
  let shape = "list";

  const resource = textInput({ value: "items", "aria-label": "Resource name" });
  const seed = textInput({ value: "mevebu", "aria-label": "Seed", class: "font-mono" });
  const items = numberInput({ min: "1", max: "100", step: "1", value: "5", "aria-label": "Items" });
  const status = selectInput(
    [
      { value: "200", label: "200 OK" },
      { value: "201", label: "201 Created" },
      { value: "400", label: "400 Bad Request" },
      { value: "401", label: "401 Unauthorized" },
      { value: "404", label: "404 Not Found" },
      { value: "422", label: "422 Unprocessable" },
      { value: "500", label: "500 Server Error" },
    ],
    { value: "200", "aria-label": "HTTP status" }
  );

  const shapeRow = chipRow(
    [
      { value: "list", label: "List" },
      { value: "item", label: "Single item" },
      { value: "error", label: "Error" },
    ],
    { value: "list", label: "Payload shape", onChange: (next) => { shape = next; sync(); run(); } }
  );

  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const result = output({ rows: 16 });
  const empty = blank("braces", "Define a field to build the payload.");
  const list = el("div", { class: "grid gap-2" });

  const itemsPanel = panel("Items", items);
  const statusPanel = panel("HTTP status", status);

  function sync() {
    itemsPanel.hidden = shape !== "list";
    statusPanel.hidden = shape !== "error";
  }

  function renderFields() {
    list.replaceChildren(
      ...fields.map((field, index) =>
        el("div", { class: "grid gap-2 rounded-r1 border border-orbit bg-deck-2 p-2 [grid-template-columns:minmax(0,1fr)_auto]" },
          el("div", { class: "grid gap-2 sm:grid-cols-2" },
            textInput({
              value: field.name,
              placeholder: `field_${index + 1}`,
              "aria-label": `Field ${index + 1} name`,
              oninput: (event) => { field.name = event.target.value; run(); },
            }),
            selectInput(TYPES.map((type) => ({ value: type.value, label: type.label })), {
              value: field.type,
              "aria-label": `Field ${index + 1} type`,
              onchange: (event) => { field.type = event.target.value; run(); },
            })),
          el("button", {
            class: "inline-flex size-9 cursor-pointer items-center justify-center self-start rounded-[5px] border-0 bg-transparent text-ink-3 hover:bg-deck hover:text-danger disabled:opacity-40",
            type: "button",
            "aria-label": `Remove field ${index + 1}`,
            disabled: fields.length === 1,
            onclick: () => { fields.splice(index, 1); renderFields(); run(); },
          }, icon("trash", "size-4")))
      )
    );
  }

  function one(random, index) {
    const out = {};
    for (const field of fields) {
      const key = field.name.trim() || `field_${index + 1}`;
      out[key] = value(field.type, random, index);
    }
    return out;
  }

  function run() {
    error.write("");
    const random = seeded(seed.value || "mevebu");
    const name = resource.value.trim() || "items";
    const count = Math.max(1, Math.min(100, Number(items.value) || 1));
    const rows = Array.from({ length: count }, (_, index) => one(random, index));

    let payload;
    let http = Number(status.value);
    if (shape === "list") {
      payload = {
        data: rows,
        meta: { page: 1, per_page: count, total: count * 4, has_more: true },
      };
      http = 200;
    } else if (shape === "item") {
      payload = { data: rows[0] };
      http = 200;
    } else {
      const messages = {
        400: "The request body is not valid JSON.",
        401: "Missing or expired token.",
        404: `No ${name} with that id.`,
        422: "The title field is required.",
        500: "Something went wrong on our side.",
      };
      payload = {
        error: { status: http, code: http === 401 ? "unauthorized" : http === 404 ? "not_found" : "bad_request", message: messages[http] ?? "Request failed." },
      };
    }

    result.write(JSON.stringify(payload, null, 2));
    empty.hidden = true;
    result.hidden = false;
    const bytes = new TextEncoder().encode(JSON.stringify(payload)).length;
    summary.textContent = `${http} · ${shape} · ${bytes} bytes${shape === "list" ? ` · ${count} item${count === 1 ? "" : "s"}` : ""}`;
  }

  resource.addEventListener("input", run);
  seed.addEventListener("input", run);
  items.addEventListener("input", run);
  status.addEventListener("change", run);

  const addButton = button("Add field", {
    icon: "plus",
    kind: "quiet",
    onclick: () => {
      fields.push({ name: `field_${fields.length + 1}`, type: "text" });
      renderFields();
      run();
    },
  });

  const copyButton = button("Copy JSON", {
    icon: "copy",
    onclick: async () => {
      try {
        await navigator.clipboard.writeText(result.textContent);
        toast("Payload copied");
      } catch {
        error.write("The clipboard is blocked here. Download the file instead.");
      }
    },
  });

  const downloadButton = button("Download .json", {
    icon: "download",
    kind: "fill",
    onclick: () => {
      if (!result.textContent) return;
      download(`${(resource.value.trim() || "payload").replace(/[^\w-]+/g, "-")}-${shape}.json`, result.textContent, "application/json");
    },
  });

  renderFields();
  sync();
  run();

  const shell = toolcard({
    body: bench(
      stack(
        panel("Resource", resource, "Used in the error message and the file name."),
        el("div", { class: "grid gap-1.5" }, el("span", { class: "text-sm font-semibold text-ink-2" }, "Shape"), shapeRow),
        itemsPanel,
        statusPanel,
        panel("Seed", seed),
        el("div", { class: "grid gap-1.5" },
          el("div", { class: "flex items-center justify-between gap-2" },
            el("span", { class: "text-sm font-semibold text-ink-2" }, "Fields"),
            addButton),
          list),
        error
      ),
      stack(summary, empty, result)
    ),
    foot: actions(copyButton, downloadButton),
  });

  slot.append(shell.node);

  return {};
}

export default { mount };
