// Turns a task description into a branch name with a type prefix.
import { bench, stack, panel, textInput, chipRow, output, copyButton, actions, toolcard } from "../core.js";

const TYPES = [
  { value: "feat", label: "feat" },
  { value: "fix", label: "fix" },
  { value: "chore", label: "chore" },
  { value: "docs", label: "docs" },
  { value: "refactor", label: "refactor" },
  { value: "test", label: "test" },
];

const slugify = (text) => text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);

export function mount(slot) {
  const description = textInput({ value: "Add dark mode", "aria-label": "Task" });
  const out = output({ rows: 1 });
  let type = "feat";
  let text = "";

  const chips = chipRow(TYPES, { value: type, label: "Type", onChange: (value) => { type = value; run(); } });

  function run() {
    const slug = slugify(description.value);
    text = slug ? `${type}/${slug}` : "";
    out.write(text);
  }

  description.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Type", chips), panel("Task", description)),
      stack(panel("Branch name", out))
    ),
    foot: actions(copyButton(() => text, "Copy branch name", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
