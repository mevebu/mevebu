// Text to Base64 and back, live in both directions. Emoji and other non-Latin
// text survive the round trip because the bytes are UTF-8.
import { bench, stack, panel, textArea, notice, copyButton, actions, toolcard } from "../core.js";

const encode = (text) => btoa(String.fromCharCode(...new TextEncoder().encode(text)));
const decode = (text) => new TextDecoder().decode(
  Uint8Array.from(atob(text.replace(/\s+/g, "")), (char) => char.charCodeAt(0))
);

export function mount(slot) {
  const plain = textArea({ rows: 7, value: "hello mevebu", "aria-label": "Plain text" });
  const coded = textArea({ rows: 7, class: "mvb-in mvb-in--area mvb-in--mono", "aria-label": "Base64" });
  const error = notice("error");
  let guard = false;

  function refresh() {
    try {
      coded.value = plain.value ? encode(plain.value) : "";
      error.write("");
    } catch {
      error.write("That text could not be encoded.");
    }
  }

  plain.addEventListener("input", () => {
    if (guard) return;
    guard = true;
    refresh();
    guard = false;
  });

  coded.addEventListener("input", () => {
    if (guard) return;
    guard = true;
    try {
      plain.value = coded.value ? decode(coded.value) : "";
      error.write("");
    } catch {
      error.write("That is not valid Base64.");
    } finally {
      guard = false;
    }
  });

  const card = toolcard({
    body: bench(
      stack(panel("Text", plain)),
      stack(panel("Base64", coded), error)
    ),
    foot: actions(
      copyButton(() => plain.value, "Copy text"),
      copyButton(() => coded.value, "Copy Base64", "fill"),
    ),
  });
  slot.append(card.node);
  refresh();

  return {};
}

export default { mount };