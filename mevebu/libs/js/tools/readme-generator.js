// Drafts a README from a project name, description and the sections you pick.
import { bench, stack, panel, textInput, toggleRow, output, copyButton, actions, toolcard } from "../core.js";

export function mount(slot) {
  const name = textInput({ value: "my-project", "aria-label": "Project name" });
  const description = textInput({ value: "A short description of the project.", "aria-label": "Description" });
  const license = textInput({ value: "MIT", "aria-label": "License" });
  const sections = toggleRow([
    { value: "features", label: "Features" },
    { value: "install", label: "Installation" },
    { value: "usage", label: "Usage" },
    { value: "license", label: "License" },
    { value: "contributing", label: "Contributing", checked: false },
  ]);
  const out = output({ rows: 18 });
  let text = "";

  function run() {
    const picked = new Set(sections.values());
    const project = name.value.trim() || "Project";
    const lines = [`# ${project}`, ""];
    if (description.value.trim()) lines.push(description.value.trim(), "");
    if (picked.has("features")) lines.push("## Features", "", "- First feature", "- Second feature", "");
    if (picked.has("install")) lines.push("## Installation", "", "```bash", `npm install ${project}`, "```", "");
    if (picked.has("usage")) lines.push("## Usage", "", "```js", "// Example", "```", "");
    if (picked.has("license")) lines.push("## License", "", license.value.trim() || "MIT", "");
    if (picked.has("contributing")) lines.push("## Contributing", "", "Issues and pull requests are welcome.", "");
    text = `${lines.join("\n").replace(/\n+$/, "")}\n`;
    out.write(text);
  }

  name.addEventListener("input", run);
  description.addEventListener("input", run);
  license.addEventListener("input", run);
  sections.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(panel("Project name", name), panel("Description", description), panel("License", license), panel("Sections", sections)),
      stack(panel("README", out))
    ),
    foot: actions(copyButton(() => text, "Copy Markdown", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
