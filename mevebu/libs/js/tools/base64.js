// Text to Base64 and back, live in both directions. Emoji and other non-Latin
// text survive the round trip because the bytes are UTF-8.
import { checkbox, bench, stack, panel, textArea, notice, copyButton, actions, toolcard } from "../core.js";

// btoa and atob take a binary string. A long input is converted in chunks,
// because spreading a whole document into String.fromCharCode overflows the
// call stack.
const CHUNK = 0x8000;

function encode(text, urlSafe) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let at = 0; at < bytes.length; at += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(at, at + CHUNK));
  }
  const base = btoa(binary);
  return urlSafe ? base.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : base;
}

function decode(text) {
  // Both alphabets are accepted and the padding goes back on: the URL-safe form
  // drops its padding, and a JWT segment turns up that way.
  const base = text.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = base.padEnd(base.length + ((4 - (base.length % 4)) % 4), "=");
  return new TextDecoder().decode(Uint8Array.from(atob(padded), (char) => char.charCodeAt(0)));
}

export function mount(slot) {
  const plain = textArea({ rows: 7, value: "hello mevebu", "aria-label": "Plain text" });
  const coded = textArea({ rows: 7, "aria-label": "Base64" });
  const urlSafeBox = checkbox("URL-safe, no padding", { checked: false });
  const error = notice("error");
  let guard = false;

  function refresh() {
    try {
      coded.value = plain.value ? encode(plain.value, urlSafeBox.input.checked) : "";
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

  urlSafeBox.input.addEventListener("change", refresh);

  const card = toolcard({
    body: bench(
      stack(panel("Text", plain)),
      stack(panel("Base64", coded), urlSafeBox, error)
    ),
    foot: actions(
      copyButton(() => plain.value, "Copy text"),
      copyButton(() => coded.value, "Copy Base64", "fill"),
    )});
  slot.append(card.node);
  refresh();

  return {};
}

export default { mount };
