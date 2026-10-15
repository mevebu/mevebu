// Drafts a changelog entry grouped under added, changed, fixed and removed.
import { el, bench, stack, panel, textInput, textArea, output, copyButton, actions, toolcard } from "../core.js";

const GROUPS = [
  { key: "added", label: "Added" },
  { key: "changed", label: "Changed" },
  { key: "fixed", label: "Fixed" },
  { key: "removed", label: "Removed" }];

export function mount(slot) {
  const version = textInput({ value: "1.0.0", mono: true, "aria-label": "Version" });
  const date = el("input", { class: "min-w-0 rounded-r1 border border-orbit bg-deck text-ink transition-[border-color,box-shadow] duration-150 placeholder:text-ink-3 hover:border-orbit-hard focus:border-jade focus:outline-none focus:ring-3 focus:ring-jade-soft w-full min-h-[var(--ctl)] px-3 py-2.5 text-base", type: "date", value: new Date().toISOString().slice(0, 10), "aria-label": "Date" });
  const fields = GROUPS.map((group) => ({ ...group, area: textArea({ rows: 3, "aria-label": group.label }) }));
  const out = output({ rows: 16 });
  let text = "";

  function run() {
    const lines = [`## [${version.value.trim() || "Unreleased"}] - ${date.value}`, ""];
    for (const group of fields) {
      const items = group.area.value.split("\n").map((line) => line.trim()).filter(Boolean);
      if (!items.length) continue;
      lines.push(`### ${group.label}`, "");
      for (const item of items) lines.push(`- ${item}`);
      lines.push("");
    }
    text = `${lines.join("\n").replace(/\n+$/, "")}\n`;
    out.write(text);
  }

  version.addEventListener("input", run);
  date.addEventListener("input", run);
  for (const group of fields) group.area.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Version", version), panel("Date", date), ...fields.map((group) => panel(group.label, group.area))),
      stack(panel("Changelog", out))
    ),
    foot: actions(copyButton(() => text, "Copy Markdown", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
