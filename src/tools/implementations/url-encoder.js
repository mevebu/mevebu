// URL Encode/Decode — encodeURIComponent semantics
import { el, icon, toast, copyText } from "../../lib/dom.js";

export function mount(container) {
  const src = el("textarea", { class: "tinput ttextarea", rows: 5, spellcheck: "false", placeholder: "Paste text or URL component…" });
  src.value = "q=hello world&lang=id";
  const out = el("textarea", { class: "tinput ttextarea code", rows: 5, readonly: true });
  let mode = "encode";
  const err = el("div", { class: "terr" });

  function run() {
    err.textContent = "";
    try {
      out.value = mode === "encode" ? encodeURIComponent(src.value) : decodeURIComponent(src.value);
    } catch { err.textContent = "⚠ Invalid percent-encoded input."; }
  }

  const segE = el("button", { class: "btn btn--accent tseg is-on", type: "button" }, "Encode");
  const segD = el("button", { class: "btn btn--ghost tseg", type: "button" }, "Decode");
  const setMode = (m) => {
    mode = m;
    segE.className = `btn tseg ${m === "encode" ? "btn--accent is-on" : "btn--ghost"}`;
    segD.className = `btn tseg ${m === "decode" ? "btn--accent is-on" : "btn--ghost"}`;
    run();
  };
  segE.onclick = () => setMode("encode");
  segD.onclick = () => setMode("decode");

  const swap = el("button", { class: "btn btn--ghost", type: "button" }, icon("arrow-left-right"), "Use output as input");
  swap.onclick = () => { src.value = out.value; run(); };
  const copy = el("button", { class: "btn btn--ghost", type: "button" }, icon("copy"), "Copy result");
  copy.onclick = async () => ((await copyText(out.value)) && toast("Copied ✓"));

  src.addEventListener("input", run);
  container.append(el("div", { class: "tstack" },
    el("div", { class: "trow" }, segE, segD),
    el("label", { class: "tfield" }, el("span", { class: "tfield__label" }, "Input"), src),
    el("label", { class: "tfield" }, el("span", { class: "tfield__label" }, "Output"), out),
    el("div", { class: "trow" }, swap, copy), err));
  run();
  return {};
}
export default { mount };
