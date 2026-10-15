// Numbers chapter and section headings from a list.
import { bench, stack, panel, textArea, numberInput, output, notice, copyButton, actions, toolcard } from "../core.js";

function levelOf(line) {
  const marks = line.match(/^(#+)\s*/);
  if (marks) return marks[1].length;
  const indent = (line.match(/^[ \t]*/) || [""])[0];
  let spaces = 0;
  for (const ch of indent) spaces += ch === "\t" ? 2 : 1;
  return 1 + Math.floor(spaces / 2);
}

const strip = (line) => line.replace(/^(#+)\s*/, "").replace(/^[ \t]+/, "").trim();

export function mount(slot) {
  const source = textArea({ rows: 12, "aria-label": "Headings", placeholder: "One heading per line" });
  const start = numberInput({ value: "1", min: "1", "aria-label": "Starting number" });
  const result = output({ rows: 12 });
  const note = notice("note");
  note.write("Levels come from leading spaces, or from # marks.");
  let text = "";

  function run() {
    const lines = source.value.split(/\r?\n/).filter((line) => line.trim());
    const startNumber = Math.max(1, Number(start.value) || 1);
    const counters = [];
    const out = [];
    for (const line of lines) {
      const level = Math.min(6, Math.max(1, levelOf(line)));
      if (counters.length < level) {
        while (counters.length < level) counters.push(0);
      } else {
        counters.length = level;
      }
      if (level === 1 && counters[0] === 0) counters[0] = startNumber - 1;
      counters[level - 1] += 1;
      for (let i = level; i < counters.length; i++) counters[i] = 0;
      const number = counters.slice(0, level).map((n) => (n === 0 ? 1 : n)).join(".");
      out.push(`${number} ${strip(line)}`);
    }
    text = out.join("\n");
    result.write(text);
  }

  source.addEventListener("input", run);
  start.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Headings", source), panel("Starting number", start), note),
      stack(panel("Numbered", result))
    ),
    foot: actions(copyButton(() => text, "Copy headings", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
