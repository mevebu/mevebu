// Base64 Encode/Decode — UTF-8 safe, live two-way
import { el, icon, toast, copyText } from "../../lib/dom.js";

const toB64 = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const fromB64 = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s+/g, "")), (c) => c.charCodeAt(0)));

export function mount(container) {
  const plain = el("textarea", { class: "tinput ttextarea", rows: 7, spellcheck: "false", placeholder: "Plain text → Base64…" });
  const encoded = el("textarea", { class: "tinput ttextarea code", rows: 7, spellcheck: "false", placeholder: "Base64 → plain text…" });
  const err = el("div", { class: "terr" });
  let lock = false;

  plain.addEventListener("input", () => {
    if (lock) return;
    lock = true;
    try { encoded.value = plain.value ? toB64(plain.value) : ""; err.textContent = ""; }
    finally { lock = false; }
  });
  encoded.addEventListener("input", () => {
    if (lock) return;
    lock = true;
    try {
      plain.value = encoded.value ? fromB64(encoded.value) : "";
      err.textContent = "";
    } catch {
      err.textContent = "⚠ That's not valid Base64.";
    } finally { lock = false; }
  });

  const encBtn = el("button", { class: "btn btn--ghost", type: "button" }, icon("copy"), "Copy Base64");
  const decBtn = el("button", { class: "btn btn--ghost", type: "button" }, icon("copy"), "Copy text");
  encBtn.onclick = async () => ((await copyText(encoded.value)) && toast("Copied ✓"));
  decBtn.onclick = async () => ((await copyText(plain.value)) && toast("Copied ✓"));

  container.append(el("div", { class: "split split--equal" },
    el("div", { class: "tstack" },
      el("label", { class: "tfield" }, el("span", { class: "tfield__label" }, "Plain text"), plain),
      encBtn),
    el("div", { class: "tstack" },
      el("label", { class: "tfield" }, el("span", { class: "tfield__label" }, "Base64"), encoded),
      decBtn, err)));
  plain.value = "hello mevebu 👋";
  plain.dispatchEvent(new Event("input"));
  return {};
}
export default { mount };
