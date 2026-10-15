// Builds a Conventional Commit message and checks the header length.
import { bench, stack, panel, textInput, textArea, selectInput, checkbox, notice, output, copyButton, actions, toolcard } from "../core.js";

const TYPES = [
  { value: "feat", label: "feat" },
  { value: "fix", label: "fix" },
  { value: "docs", label: "docs" },
  { value: "style", label: "style" },
  { value: "refactor", label: "refactor" },
  { value: "perf", label: "perf" },
  { value: "test", label: "test" },
  { value: "build", label: "build" },
  { value: "ci", label: "ci" },
  { value: "chore", label: "chore" },
];

export function mount(slot) {
  const type = selectInput(TYPES, { value: "feat", "aria-label": "Type" });
  const scope = textInput({ placeholder: "core", "aria-label": "Scope" });
  const description = textInput({ value: "add dark mode", "aria-label": "Description" });
  const body = textArea({ rows: 3, "aria-label": "Body" });
  const breaking = checkbox("Breaking change");
  const check = notice("warn");
  const out = output({ rows: 8 });
  let text = "";

  function run() {
    const desc = description.value.trim();
    const scoped = scope.value.trim();
    const header = `${type.value}${scoped ? `(${scoped})` : ""}${breaking.input.checked ? "!" : ""}: ${desc}`;
    const lines = [header];
    if (body.value.trim()) lines.push("", body.value.trim());
    if (breaking.input.checked) lines.push("", `BREAKING CHANGE: ${desc || "describe the change"}`);
    text = lines.join("\n");
    out.write(text);

    if (!desc) check.write("Add a short description.");
    else if (header.length > 72) check.write(`Header is ${header.length} characters, keep it at 72 or less.`);
    else if (/\.$/.test(desc)) check.write("Drop the trailing period.");
    else check.write("");
  }

  type.addEventListener("change", run);
  scope.addEventListener("input", run);
  description.addEventListener("input", run);
  body.addEventListener("input", run);
  breaking.input.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(panel("Type", type), panel("Scope", scope), panel("Description", description), panel("Body", body), breaking, check),
      stack(panel("Message", out))
    ),
    foot: actions(copyButton(() => text, "Copy message", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
