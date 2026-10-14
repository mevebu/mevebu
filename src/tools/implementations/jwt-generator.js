// JWT Generator — HS256 via Web Crypto, fully local
import { el, icon, toast, copyText } from "../../lib/dom.js";

const b64urlFromBytes = (bytes) => {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const b64urlFromString = (str) => b64urlFromBytes(new TextEncoder().encode(str));
const enc = new TextEncoder();

async function hmacSha256(keyData, msg) {
  const key = await crypto.subtle.importKey("raw", enc.encode(keyData), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return new Uint8Array(sig);
}

export function mount(container) {
  const header = el("textarea", { class: "tinput ttextarea code", rows: 3, spellcheck: "false" });
  header.value = '{\n  "alg": "HS256",\n  "typ": "JWT"\n}';
  const payload = el("textarea", { class: "tinput ttextarea code", rows: 7, spellcheck: "false" });
  payload.value = '{\n  "sub": "1234567890",\n  "name": "mevebu",\n  "admin": true,\n  "iat": ' + Math.floor(Date.now() / 1000) + "\n}";
  const secret = el("input", { class: "tinput", type: "text", value: "your-256-bit-secret" });
  const tokenOut = el("textarea", { class: "tinput ttextarea code", rows: 4, readonly: true, spellcheck: "false" });
  const err = el("div", { class: "terr" });

  const signBtn = el("button", { class: "btn btn--accent", type: "button" }, icon("key-round"), "Sign");
  const copyBtn = el("button", { class: "btn btn--ghost", type: "button" }, icon("copy"), "Copy token");

  async function sign() {
    err.textContent = "";
    try { JSON.parse(header.value); JSON.parse(payload.value); }
    catch (e) { err.textContent = "Invalid JSON: " + e.message; return; }
    const h = b64urlFromString(JSON.stringify(JSON.parse(header.value)));
    const p = b64urlFromString(JSON.stringify(JSON.parse(payload.value)));
    const msg = `${h}.${p}`;
    const sig = await hmacSha256(secret.value || "", msg);
    tokenOut.value = `${msg}.${b64urlFromBytes(sig)}`;
  }

  signBtn.addEventListener("click", sign);
  copyBtn.addEventListener("click", async () => {
    if (!tokenOut.value) return toast("Sign a token first.");
    (await copyText(tokenOut.value)) && toast("Token copied ✓");
  });

  container.append(el("div", { class: "split" },
    el("div", { class: "tstack" },
      el("label", { class: "tfield" }, el("span", { class: "tfield__label" }, "Header (JSON)"), header),
      el("label", { class: "tfield" }, el("span", { class: "tfield__label" }, "Payload (JSON)"), payload),
      el("label", { class: "tfield" }, el("span", { class: "tfield__label" }, "Secret (HS256)"), secret),
      err),
    el("div", { class: "tstack" },
      el("div", { class: "trow" }, signBtn, copyBtn),
      el("label", { class: "tfield" }, el("span", { class: "tfield__label" }, "Encoded token"), tokenOut),
      el("p", { class: "tnote" }, icon("shield", "icon-sm"), " Signed locally with Web Crypto — your secret never leaves this tab."))
  ));
  sign(); // initial demo token
  return {};
}
export default { mount };
