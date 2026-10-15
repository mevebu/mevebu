// Signs a JSON Web Token with HS256. Checks that the JSON parses and shows a
// readable decode of the payload, so a typo surfaces before signing.
import { el, icon, bench, stack, panel, textArea, textInput, notice, copyButton, output, debounce, actions, toolcard } from "../core.js";

const encoder = new TextEncoder();

// Only claims that carry a value the JSON does not show by itself: a Unix
// timestamp means nothing to read, the date behind it does.
const TIME_CLAIMS = [["iat", "Issued at"], ["nbf", "Not before"], ["exp", "Expires"]];

const toUrl = (bytes) => {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const toUrlString = (text) => toUrl(encoder.encode(text));

export function mount(slot) {
  const now = Math.floor(Date.now() / 1000);

  const headerField = textArea({ rows: 3, value: '{\n  "alg": "HS256",\n  "typ": "JWT"\n}' });
  const payloadField = textArea({
    rows: 7,
    value: `{\n  "sub": "1234567890",\n  "name": "Ada",\n  "admin": true,\n  "iat": ${now}\n}`});
  const secretField = textInput({ type: "password", value: "your-256-bit-secret", autocomplete: "new-password" });
  const showButton = el(
    "button",
    { class: "inline-flex size-[var(--ctl)] cursor-pointer items-center justify-center rounded-r1 border border-transparent bg-transparent text-ink-2 transition-colors duration-150 hover:bg-deck-2 hover:text-ink focus-visible:border-jade", type: "button", "aria-label": "Show secret", "aria-pressed": "false" },
    icon("eye")
  );
  const error = notice("error");
  const tokenOut = output({ tag: "textarea", rows: 4 });
  const decoded = output({ rows: 4 });
  const timePanel = panel("Time claims", decoded);

  const copyBtn = copyButton(() => tokenOut.value, "Copy token", "fill");

  showButton.addEventListener("click", () => {
    const visible = secretField.type === "text";
    secretField.type = visible ? "password" : "text";
    showButton.replaceChildren(icon(visible ? "eye" : "eye-off"));
    showButton.setAttribute("aria-label", visible ? "Show secret" : "Hide secret");
    showButton.setAttribute("aria-pressed", String(!visible));
  });

  async function sign() {
    error.write("");
    let header;
    let payload;
    try {
      header = JSON.parse(headerField.value);
      payload = JSON.parse(payloadField.value);
    } catch (caught) {
      error.write(`That JSON does not parse. ${caught.message}`);
      return;
    }
    if (header.alg && header.alg !== "HS256") {
      error.write("HS256 is the only algorithm here. Change alg to HS256.");
      return;
    }
    let token = "";
    try {
      const first = toUrlString(JSON.stringify(header));
      const second = toUrlString(JSON.stringify(payload));
      const message = `${first}.${second}`;
      const key = await crypto.subtle.importKey("raw", encoder.encode(secretField.value), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
      token = `${message}.${toUrl(new Uint8Array(signature))}`;
    } catch (caught) {
      error.write(`Signing failed. ${caught.message}`);
      return;
    }
    tokenOut.write(token);
    const times = TIME_CLAIMS
      .filter(([key]) => payload[key] !== undefined)
      .map(([key, label]) => {
        const value = Number(payload[key]);
        return Number.isFinite(value) ? `${label}: ${new Date(value * 1000).toLocaleString()}` : `${label}: ${payload[key]}`;
      });
    timePanel.hidden = !times.length;
    decoded.write(times.join("\n"));
  }

  // Live signing. The textareas are the only slow field: invalid JSON while a
  // half-typed brace is on screen is normal, so the wait is longer than usual.
  const live = debounce(sign, 250);
  for (const field of [headerField, payloadField, secretField]) {
    field.addEventListener("input", live);
  }

  const card = toolcard({
    body: bench(
      stack(
        panel("Header", headerField),
        panel("Payload", payloadField),
        panel("Secret", el("div", { class: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2" }, secretField, showButton)),
        error
      ),
      stack(panel("Token", tokenOut), timePanel)
    ),
    foot: actions(copyBtn)});
  slot.append(card.node);
  sign();

  return {};
}

export default { mount };