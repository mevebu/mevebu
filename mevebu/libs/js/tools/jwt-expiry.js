// Reads the time claims of a JWT and says whether it looks expired.
import { el, textArea, notice, copyButton, bench, stack, panel, actions, toolcard } from "../core.js";

const CLAIMS = [["iat", "Issued at"], ["nbf", "Not before"], ["exp", "Expires"]];

function decodeSegment(segment) {
  const base = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base.padEnd(base.length + ((4 - (base.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function relative(seconds) {
  const diff = Math.round(seconds - Date.now() / 1000);
  const abs = Math.abs(diff);
  const [unit, size] = abs < 60 ? ["second", 1] : abs < 3600 ? ["minute", 60] : abs < 86400 ? ["hour", 3600] : ["day", 86400];
  const value = Math.round(abs / size);
  const text = `${value} ${unit}${value === 1 ? "" : "s"}`;
  return diff >= 0 ? `in ${text}` : `${text} ago`;
}

const kvRow = (key, value) =>
  el("div", { class: "mvb-kv__row" }, el("span", { class: "mvb-kv__k" }, key), el("span", { class: "mvb-kv__v" }, value));

export function mount(slot) {
  const source = textArea({ rows: 4, class: "mvb-in mvb-in--area mvb-in--mono", "aria-label": "Token", placeholder: "Paste a JWT" });
  const claims = el("div", { class: "mvb-kv" });
  const status = notice("note");
  const error = notice("error");
  let summary = "";

  function run() {
    claims.replaceChildren();
    status.write("");
    error.write("");
    summary = "";
    const token = source.value.trim();
    if (!token) return;
    const parts = token.split(".");
    if (parts.length < 2) {
      error.write("A JWT has three parts separated by dots.");
      return;
    }
    let payload;
    try {
      payload = decodeSegment(parts[1]);
    } catch {
      error.write("The payload is not readable base64url JSON.");
      return;
    }

    const lines = [];
    for (const [key, label] of CLAIMS) {
      if (payload[key] === undefined) continue;
      const value = Number(payload[key]);
      const when = Number.isFinite(value) ? new Date(value * 1000).toLocaleString() : String(payload[key]);
      const extra = Number.isFinite(value) ? ` (${relative(value)})` : "";
      claims.append(kvRow(label, `${when}${extra}`));
      lines.push(`${label}: ${when}${extra}`);
    }

    if (payload.exp === undefined) {
      status.write("No exp claim. This token has no stated expiry.");
    } else {
      const exp = Number(payload.exp);
      if (!Number.isFinite(exp)) {
        status.write("The exp claim is not a number.");
      } else if (exp * 1000 < Date.now()) {
        status.write(`Looks expired, ${relative(exp)}.`);
      } else {
        status.write(`Looks valid, expires ${relative(exp)}.`);
      }
    }
    summary = lines.join("\n");
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(
        panel("Token", source),
        error,
        el("p", { class: "mvb-note" }, "Only the payload is read in this tab. The signature is not checked, so a valid look is not proof the token is genuine.")
      ),
      stack(panel("Time claims", claims), status)
    ),
    foot: actions(copyButton(() => summary, "Copy claims", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
