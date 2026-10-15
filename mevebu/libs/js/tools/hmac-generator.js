// HMAC-SHA signatures for a message and a key, computed in this tab.
import { el, icon, textArea, passwordInput, selectInput, output, notice, button, copyButton, bench, stack, panel, actions, toolcard, debounce } from "../core.js";

const ALGORITHMS = [
  { value: "SHA-256", label: "SHA-256" },
  { value: "SHA-384", label: "SHA-384" },
  { value: "SHA-512", label: "SHA-512" },
  { value: "SHA-1", label: "SHA-1" },
];

const encoder = new TextEncoder();
const toHex = (bytes) => [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");

export function mount(slot) {
  const message = textArea({ rows: 5, value: "mevebu", "aria-label": "Message", placeholder: "Type or paste the message" });
  const secret = passwordInput({ value: "your-256-bit-secret", autocomplete: "off", "aria-label": "Secret key" });
  const showButton = button("Show", { icon: "eye" });
  const hashField = selectInput(ALGORITHMS, { value: "SHA-256", "aria-label": "Hash" });
  const result = output();
  const error = notice("error");

  showButton.addEventListener("click", () => {
    const visible = secret.type === "text";
    secret.type = visible ? "password" : "text";
    showButton.replaceChildren(icon(visible ? "eye" : "eye-off"), el("span", {}, visible ? "Show" : "Hide"));
  });

  async function run() {
    error.write("");
    result.write("");
    if (!message.value || !secret.value) return;
    try {
      const key = await crypto.subtle.importKey("raw", encoder.encode(secret.value), { name: "HMAC", hash: hashField.value }, false, ["sign"]);
      const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message.value));
      result.write(toHex(new Uint8Array(signature)));
    } catch (caught) {
      error.write(caught.message || "Signing failed.");
    }
  }

  const live = debounce(run, 150);
  for (const field of [message, secret]) field.addEventListener("input", live);
  hashField.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(
        panel("Message", message),
        panel("Secret key", el("div", { class: "mvb-secret" }, secret, showButton)),
        panel("Hash", hashField),
        el("p", { class: "mvb-note" }, "The message and key stay in this tab. Do not paste a production secret into a site you do not trust.")
      ),
      stack(panel("Signature", result), error)
    ),
    foot: actions(copyButton(() => result.textContent, "Copy signature", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
