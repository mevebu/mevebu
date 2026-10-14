// Hash Generator — SHA-1/256/384/512 via Web Crypto
import { el, icon, toast, copyText, chipGroup } from "../../lib/dom.js";

async function digest(algo, text) {
  const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function mount(container) {
  let algo = "SHA-256";
  const chips = chipGroup(
    ["SHA-1", "SHA-256", "SHA-384", "SHA-512"].map((a) => ({ value: a, label: a })),
    { value: algo, onChange: (v) => { algo = v; run(); } }
  );
  const src = el("textarea", { class: "tinput ttextarea", rows: 5, spellcheck: "false", placeholder: "Type or paste text to hash…" });
  src.value = "mevebu";
  const out = el("pre", { class: "tout tout--block breakable" }, "");
  const meta = el("div", { class: "tnote" }, "");

  async function run() {
    if (!src.value) { out.textContent = ""; meta.textContent = ""; return; }
    const hex = await digest(algo, src.value);
    out.textContent = hex;
    meta.textContent = `${algo} · ${hex.length / 2} bytes`;
  }

  const copyBtn = el("button", { class: "btn btn--ghost", type: "button" }, icon("copy"), "Copy hash");
  copyBtn.onclick = async () => out.textContent && ((await copyText(out.textContent)) && toast("Hash copied ✓"));
  src.addEventListener("input", run);

  container.append(el("div", { class: "tstack" },
    chips, src,
    el("div", { class: "trow" }, copyBtn, meta),
    out));
  run();
  return {};
}
export default { mount };
