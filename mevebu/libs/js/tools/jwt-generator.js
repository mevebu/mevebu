// Signs a JSON Web Token with HMAC. Checks that the JSON parses and shows a
// readable decode of the payload, so a typo surfaces before signing.
import { el, icon, bench, stack, panel, textArea, textInput, selectInput, notice, copyButton, output, button, debounce, actions, toolcard } from "../core.js";

const encoder = new TextEncoder();

// What can actually be signed here. The select is built from this, so the list
// and the signing call can never drift apart.
const ALGS = { HS256: "SHA-256", HS384: "SHA-384", HS512: "SHA-512" };
const TYPES = ["JWT", "at+jwt"];

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

  const headerField = textArea({ rows: 6, value: '{\n  "alg": "HS256",\n  "typ": "JWT"\n}' });
  const payloadField = textArea({
    rows: 6,
    value: `{\n  "sub": "1234567890",\n  "name": "Ada",\n  "admin": true,\n  "iat": ${now}\n}`});
  const secretField = textInput({ type: "password", value: "your-256-bit-secret", autocomplete: "new-password" });
  const algField = selectInput(Object.keys(ALGS), { value: "HS256", "aria-label": "Algorithm" });
  const typField = selectInput(TYPES, { value: "JWT", "aria-label": "Token type" });
  const showButton = button("", { icon: "eye", kind: "plain", "aria-label": "Show secret", "aria-pressed": "false" });
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

  /** The header as data, or null while it is mid edit. */
  const readHeader = () => {
    try {
      const parsed = JSON.parse(headerField.value);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  };

  /** A header typed by hand still moves the two selects when it names a known value. */
  function followHeader() {
    const header = readHeader();
    if (!header) return;
    if (ALGS[header.alg]) algField.value = header.alg;
    if (TYPES.includes(header.typ)) typField.value = header.typ;
  }

  /** A select writes back into the header, which stays the one source of truth. */
  function writeHeader() {
    const header = readHeader() ?? {};
    header.alg = algField.value;
    header.typ = typField.value;
    headerField.value = JSON.stringify(header, null, 2);
    sign();
  }

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
    const hash = ALGS[header.alg];
    if (!hash) {
      error.write(`Only ${Object.keys(ALGS).join(", ")} can be signed here. Set alg to one of those.`);
      return;
    }
    let token = "";
    try {
      const first = toUrlString(JSON.stringify(header));
      const second = toUrlString(JSON.stringify(payload));
      const message = `${first}.${second}`;
      const key = await crypto.subtle.importKey("raw", encoder.encode(secretField.value), { name: "HMAC", hash }, false, ["sign"]);
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
  headerField.addEventListener("input", () => { followHeader(); live(); });
  for (const field of [payloadField, secretField]) field.addEventListener("input", live);
  for (const field of [algField, typField]) field.addEventListener("change", writeHeader);

  const card = toolcard({
    body: bench(
      stack(
        // The secret leads the column: it is the one field a visitor has to fill
        // before the token means anything, and the two header choices are the
        // adjustment after it.
        panel("Secret", el("div", { class: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2" }, secretField, showButton)),
        panel("Algorithm", algField),
        panel("Type", typField),
        error
      ),
      stack(
        // Header and payload sit side by side once there is room for two columns,
        // which is the pair a reader compares anyway.
        el("div", { class: "grid gap-4 min-[80rem]:grid-cols-2" },
          panel("Header", headerField),
          panel("Payload", payloadField)),
        panel("Token", tokenOut),
        timePanel
      )
    ),
    foot: actions(copyBtn)});
  slot.append(card.node);
  sign();

  return {};
}

export default { mount };
