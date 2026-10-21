// Finds the characters that take space but draw nothing, which is the usual
// reason a copied identifier or URL fails somewhere else.
import { el, bench, stack, panel, textArea, toggleRow, output, copyButton, actions, toolcard, blank } from "../core.js";

const KINDS = [
  { value: "zero", label: "Zero width" },
  { value: "space", label: "Unusual spaces" },
  { value: "bidi", label: "Direction marks" },
  { value: "other", label: "Other" },
];

const NAMES = new Map([
  [0x200b, ["zero", "Zero width space"]],
  [0x200c, ["zero", "Zero width non-joiner"]],
  [0x200d, ["zero", "Zero width joiner"]],
  [0x2060, ["zero", "Word joiner"]],
  [0xfeff, ["zero", "Byte order mark"]],
  [0x00ad, ["zero", "Soft hyphen"]],
  [0x180e, ["zero", "Mongolian vowel separator"]],
  [0x034f, ["zero", "Combining grapheme joiner"]],
  [0x00a0, ["space", "Non-breaking space"]],
  [0x2007, ["space", "Figure space"]],
  [0x2009, ["space", "Thin space"]],
  [0x200a, ["space", "Hair space"]],
  [0x202f, ["space", "Narrow non-breaking space"]],
  [0x205f, ["space", "Medium mathematical space"]],
  [0x3000, ["space", "Ideographic space"]],
  [0x200e, ["bidi", "Left-to-right mark"]],
  [0x200f, ["bidi", "Right-to-left mark"]],
  [0x061c, ["bidi", "Arabic letter mark"]],
  [0x202a, ["bidi", "Left-to-right embedding"]],
  [0x202b, ["bidi", "Right-to-left embedding"]],
  [0x202c, ["bidi", "Pop directional formatting"]],
  [0x202d, ["bidi", "Left-to-right override"]],
  [0x202e, ["bidi", "Right-to-left override"]],
  [0x2066, ["bidi", "Left-to-right isolate"]],
  [0x2067, ["bidi", "Right-to-left isolate"]],
  [0x2068, ["bidi", "First strong isolate"]],
  [0x2069, ["bidi", "Pop directional isolate"]],
  [0x2061, ["other", "Function application"]],
  [0x2062, ["other", "Invisible times"]],
  [0x2063, ["other", "Invisible separator"]],
  [0x2064, ["other", "Invisible plus"]],
]);

// Two code point ranges have no single name worth printing.
function describe(code) {
  if (code >= 0x2000 && code <= 0x2006) return ["space", "En space"];
  return NAMES.get(code) ?? null;
}

const hex = (code) => `U+${code.toString(16).toUpperCase().padStart(4, "0")}`;

const KIND_TONE = {
  zero: "border-jade/40 text-ink",
  space: "border-star/40 text-ink",
  bidi: "border-danger/40 text-ink",
  other: "border-orbit-hard text-ink",
};

export function mount(slot) {
  const source = textArea({ rows: 10, "aria-label": "Text to inspect" });
  const kinds = toggleRow(KINDS, { columns: 2 });
  const summary = el("p", { class: "text-sm text-ink-2" }, "Paste text to look for characters that draw nothing.");
  const list = el("div", { class: "grid gap-1" });
  const cleanedOut = output({ rows: 6 });
  const result = el("div", { class: "grid gap-2" });
  const empty = blank("eye-off", "No invisible characters found.");
  let found = [];
  let cleaned = "";

  function scan(text) {
    const starts = [0];
    for (let index = 0; index < text.length; index++) if (text[index] === "\n") starts.push(index + 1);
    const hits = [];
    let index = 0;
    for (const character of text) {
      const code = character.codePointAt(0);
      const entry = describe(code);
      if (entry) {
        const line = starts.filter((start) => start <= index).length;
        hits.push({ code, name: entry[1], kind: entry[0], line, column: index - starts[line - 1] + 1 });
      }
      index += character.length;
    }
    return hits;
  }

  function run() {
    const text = source.value;
    if (!text) {
      found = [];
      cleaned = "";
      summary.textContent = "Paste text to look for characters that draw nothing.";
      result.replaceChildren();
      cleanedOut.write("");
      return;
    }
    found = scan(text);
    const selected = new Set(kinds.values());
    const removable = new Set(found.filter((hit) => selected.has(hit.kind)).map((hit) => hit.code));
    cleaned = [...text].filter((character) => !removable.has(character.codePointAt(0))).join("");

    if (!found.length) {
      summary.textContent = "This text contains no invisible characters.";
      result.replaceChildren(empty);
      cleanedOut.write(text);
      return;
    }
    summary.textContent = `${found.length} found in ${new Set(found.map((hit) => hit.code)).size} kinds.`;
    result.replaceChildren(el("div", { class: "grid gap-1" },
      ...found.slice(0, 500).map((hit) =>
        el("div", { class: "flex flex-wrap items-center gap-2 rounded-r1 border border-orbit bg-deck-2 px-3 py-2 text-sm" },
          el("span", { class: `rounded-full border px-2 py-0.5 text-2xs font-semibold ${KIND_TONE[hit.kind]}` }, hex(hit.code)),
          el("span", { class: "font-medium" }, hit.name),
          el("span", { class: "ms-auto text-2xs text-ink-3 tabular-nums" }, `line ${hit.line}, column ${hit.column}`)))));
    cleanedOut.write(cleaned);
  }

  const copyList = () => found.map((hit) => `${hex(hit.code)} ${hit.name} line ${hit.line}, column ${hit.column}`).join("\n");

  source.addEventListener("input", run);
  kinds.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(panel("Text", source), panel("Remove", kinds, "Cleaned text drops the kinds you keep ticked.")),
      stack(summary, result, panel("Cleaned text", cleanedOut)),
    ),
    foot: actions(copyButton(copyList, "Copy list"), copyButton(() => cleaned, "Copy cleaned", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
