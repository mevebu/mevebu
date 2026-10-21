// UTF-8 bytes as eight bit groups, and back. It is an encoding, not a secret.
import { el, bench, stack, panel, textArea, checkbox, notice, copyButton, actions, toolcard } from "../core.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

const bits = (bytes) => [...bytes].map((byte) => byte.toString(2).padStart(8, "0")).join(" ");

function toBytes(text, spaced) {
  const source = spaced ? text.trim().split(/\s+/) : text.replace(/\s+/g, "").match(/.{1,8}/g) ?? [];
  if (source.some((group) => !/^[01]{1,8}$/.test(group))) throw new Error("Only 0 and 1, in groups of up to eight.");
  const padded = spaced ? source.map((group) => group.padStart(8, "0")) : source.map((group) => group.padEnd(8, "0"));
  return Uint8Array.from(padded.map((group) => parseInt(group, 2)));
}

export function mount(slot) {
  const textSide = textArea({ rows: 9, "aria-label": "Text", placeholder: "Hello" });
  const binarySide = textArea({ rows: 9, "aria-label": "Binary", placeholder: "01001000 01100101 01101100 01101100 01101111" });
  const spaced = checkbox("Spaces between bytes", { checked: true });
  const error = notice("error");
  let syncing = false;

  function fromText() {
    if (syncing) return;
    syncing = true;
    error.write("");
    const bytes = encoder.encode(textSide.value);
    binarySide.value = spaced.input.checked ? bits(bytes) : bits(bytes).replaceAll(" ", "");
    syncing = false;
  }

  function fromBinary() {
    if (syncing) return;
    syncing = true;
    error.write("");
    try {
      const bytes = toBytes(binarySide.value, spaced.input.checked);
      textSide.value = decoder.decode(bytes);
    } catch (caught) {
      textSide.value = "";
      error.write(caught instanceof TypeError ? "These bytes are not valid UTF-8." : caught.message);
    }
    syncing = false;
  }

  textSide.addEventListener("input", fromText);
  binarySide.addEventListener("input", fromBinary);
  spaced.input.addEventListener("change", fromText);

  const card = toolcard({
    body: bench(
      stack(panel("Text", textSide), panel("", spaced), error),
      stack(panel("Binary, UTF-8", binarySide)),
    ),
    foot: actions(copyButton(() => textSide.value, "Copy text"), copyButton(() => binarySide.value, "Copy binary", "fill")),
  });
  slot.append(card.node);
  textSide.value = "Hello";
  fromText();

  return {};
}

export default { mount };
