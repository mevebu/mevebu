// The hash of text you paste, in the SHA family, with the byte length beside it.
import { el, chipRow, textArea, copyButton, bench, stack, panel, output, notice, actions, toolcard } from "../core.js";

const ALGORITHMS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];

export function mount(slot) {
  const source = textArea({ value: "mevebu", rows: 5, "aria-label": "Text to hash", placeholder: "Type or paste text" });
  const result = output();
  const digest = el("p", { class: "border-s-[3px] border-transparent ps-2 text-sm text-ink-3" });
  const error = notice("error");

  let algorithm = "SHA-256";

  const chips = chipRow(ALGORITHMS.map((name) => ({ value: name, label: name.replace("SHA-", "") })), {
    value: algorithm,
    label: "Algorithm",
    onChange: (value) => {
      algorithm = value;
      run();
    }});

  async function run() {
    error.write("");
    if (!source.value) {
      result.write("");
      digest.textContent = "";
      return;
    }
    try {
      const bytes = await crypto.subtle.digest(algorithm, new TextEncoder().encode(source.value));
      const hex = [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
      result.write(hex);
      digest.textContent = `${algorithm}, ${hex.length / 2} bytes.`;
    } catch (caught) {
      error.write(caught.message || "Hashing failed.");
    }
  }

  source.addEventListener("input", run);
  const copy = copyButton(() => result.textContent, "Copy hash");

  const card = toolcard({
    body: bench(
      stack(panel("Algorithm", chips), panel("Text", source)),
      stack(panel("Hash", result), digest, error)
    ),
    foot: actions(copy)});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };