// Escapes text for a JSON string and unescapes it back.
import { bench, stack, panel, textArea, output, notice, chipRow, copyButton, actions, toolcard } from "../core.js";

function escapeJson(text) {
  return JSON.stringify(text).slice(1, -1);
}

function unescapeJson(text) {
  if (/\\(u(?![0-9a-fA-F]{4})|[^"\\/bfnrtu]|$)/.test(text)) return { ok: false, text: "" };
  const out = text.replace(/\\(u[0-9a-fA-F]{4}|["\\/bfnrt])/g, (match, seq) => {
    switch (seq) {
      case "n": return "\n";
      case "t": return "\t";
      case "r": return "\r";
      case "b": return "\b";
      case "f": return "\f";
      case "/": return "/";
      case '"': return '"';
      case "\\": return "\\";
      default: return String.fromCharCode(parseInt(seq.slice(1), 16));
    }
  });
  return { ok: true, text: out };
}

export function mount(slot) {
  const source = textArea({ rows: 7, value: 'He said "hi".', "aria-label": "Input" });
  const result = output({ value: "", rows: 7 });
  const error = notice("error");
  let mode = "escape";
  let text = "";

  const chips = chipRow(
    [{ value: "escape", label: "Escape" }, { value: "unescape", label: "Unescape" }],
    { value: "escape", label: "Direction", onChange: (value) => { mode = value; run(); } }
  );

  function run() {
    error.write("");
    if (!source.value) {
      text = "";
      result.write("");
      return;
    }
    if (mode === "escape") {
      text = escapeJson(source.value);
      result.write(text);
      return;
    }
    const decoded = unescapeJson(source.value);
    if (!decoded.ok) {
      text = "";
      result.write("");
      error.write("That is not a valid escape sequence.");
      return;
    }
    text = decoded.text;
    result.write(text);
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Direction", chips), panel("Input", source)),
      stack(panel("Result", result), error)
    ),
    foot: actions(copyButton(() => text, "Copy result", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
