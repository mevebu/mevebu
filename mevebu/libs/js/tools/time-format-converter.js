// Switches times between 12 and 24 hour format, one time per line.
import { bench, stack, panel, textArea, chipRow, notice, output, copyButton, actions, toolcard } from "../core.js";

const pad = (n) => String(n).padStart(2, "0");

function read24(line) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(line);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

function read12(line) {
  const match = /^(\d{1,2}):(\d{2})\s*([ap])\.?m\.?$/i.exec(line);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const half = match[3].toLowerCase();
  if (hours < 1 || hours > 12 || minutes > 59) return null;
  if (half === "p" && hours !== 12) hours += 12;
  if (half === "a" && hours === 12) hours = 0;
  return { hours, minutes };
}

function to24({ hours, minutes }) {
  return `${pad(hours)}:${pad(minutes)}`;
}

function to12({ hours, minutes }) {
  const half = hours < 12 ? "AM" : "PM";
  let clock = hours % 12;
  if (clock === 0) clock = 12;
  return `${clock}:${pad(minutes)} ${half}`;
}

export function mount(slot) {
  const source = textArea({ rows: 8, value: "13:05\n00:30\n9:45 PM", "aria-label": "Times, one per line", placeholder: "13:05" });
  const target = output({ value: "", rows: 8 });
  const error = notice("error");
  let format = "24";
  let text = "";

  const picker = chipRow(
    [{ value: "24", label: "24 hour input" }, { value: "12", label: "12 hour input" }],
    { value: format, label: "Input format", onChange: (value) => { format = value; run(); } }
  );

  function run() {
    error.write("");
    const lines = source.value.split("\n");
    const out = [];
    let bad = 0;
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      const parsed = format === "24" ? read24(line) : read12(line);
      if (!parsed) {
        bad += 1;
        out.push(line);
        continue;
      }
      out.push(format === "24" ? to12(parsed) : to24(parsed));
    }
    target.write(out.join("\n"));
    text = out.join("\n");
    if (bad) error.write(`${bad} lines could not be read.`);
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Input format", picker), panel("Times", source), error),
      stack(panel("Converted", target))
    ),
    foot: actions(copyButton(() => text, "Copy times", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
