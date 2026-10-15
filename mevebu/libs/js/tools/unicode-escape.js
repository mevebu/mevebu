// Turns characters into Unicode escape sequences and back.
import { bench, stack, panel, textArea, output, notice, chipRow, copyButton, actions, toolcard } from "../core.js";

function encode(text) {
  return Array.from(text).map((char) => {
    const point = char.codePointAt(0);
    return point <= 0xffff
      ? `\\u${point.toString(16).toUpperCase().padStart(4, "0")}`
      : `\\u{${point.toString(16).toUpperCase()}}`;
  }).join("");
}

function decode(text) {
  let ok = true;
  const out = text.replace(/\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})|\\u/g, (match, braced, plain) => {
    if (match === "\\u") {
      ok = false;
      return match;
    }
    const point = parseInt(braced ?? plain, 16);
    if (point > 0x10ffff) {
      ok = false;
      return match;
    }
    return String.fromCodePoint(point);
  });
  return { ok, text: out };
}

export function mount(slot) {
  const source = textArea({ rows: 7, value: "mevebu", "aria-label": "Input" });
  const result = output({ value: "", rows: 7 });
  const error = notice("error");
  let mode = "encode";
  let text = "";

  const chips = chipRow(
    [{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }],
    { value: "encode", label: "Direction", onChange: (value) => { mode = value; run(); } }
  );

  function run() {
    error.write("");
    if (!source.value) {
      text = "";
      result.write("");
      return;
    }
    if (mode === "encode") {
      text = encode(source.value);
      result.write(text);
      return;
    }
    const decoded = decode(source.value);
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
