// Reads a JWT header and payload. Decoding is not signature validation.
import { el, bench, stack, panel, textArea, notice, output, copyButton, actions, toolcard } from "../core.js";

const TIME_CLAIMS = [["iat", "Issued at"], ["nbf", "Not before"], ["exp", "Expires"]];

function decodeSegment(segment) {
  const base = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base.padEnd(base.length + ((4 - (base.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function mount(slot) {
  const source = textArea({ rows: 4, "aria-label": "Token", placeholder: "Paste a JWT" });
  const headerOut = output({ rows: 4 });
  const payloadOut = output({ rows: 8 });
  const claims = el("div", { class: "grid gap-px overflow-hidden rounded-r1 border border-orbit bg-orbit" });
  const error = notice("error");

  function render() {
    headerOut.write("");
    payloadOut.write("");
    claims.replaceChildren();
    error.write("");
    const token = source.value.trim();
    if (!token) return;
    const parts = token.split(".");
    if (parts.length < 2) {
      error.write("A JWT has three parts separated by dots.");
      return;
    }
    try {
      headerOut.write(JSON.stringify(decodeSegment(parts[0]), null, 2));
    } catch {
      error.write("The header is not readable base64url JSON.");
      return;
    }
    let payload;
    try {
      payload = decodeSegment(parts[1]);
      payloadOut.write(JSON.stringify(payload, null, 2));
    } catch {
      error.write("The payload is not readable base64url JSON.");
      return;
    }
    for (const [key, label] of TIME_CLAIMS) {
      if (payload[key] === undefined) continue;
      const value = Number(payload[key]);
      const when = Number.isFinite(value) ? new Date(value * 1000).toLocaleString() : String(payload[key]);
      claims.append(
        el("div", { class: "grid gap-3 bg-deck px-3 py-[9px] [grid-template-columns:minmax(90px,34%)_minmax(0,1fr)]" },
          el("span", { class: "wrap-anywhere text-2xs font-semibold text-ink-2" }, label),
          el("span", { class: "wrap-anywhere font-mono text-2xs" }, when))
      );
    }
  }

  source.addEventListener("input", render);

  const card = toolcard({
    body: bench(
      stack(panel("Token", source), error),
      stack(panel("Header", headerOut), panel("Payload", payloadOut), claims)
    ),
    foot: actions(copyButton(() => payloadOut.textContent, "Copy payload", "fill"))});
  slot.append(card.node);
  render();

  return {};
}

export default { mount };
