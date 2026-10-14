// QR Generator — pure-JS QR encoder (byte mode, EC level M), renders to canvas/SVG
import { el, icon, toast, copyText, download } from "../../lib/dom.js";
import { qrcode } from "../vendor/qr.js";

export function mount(container) {
  const src = el("textarea", { class: "tinput ttextarea", rows: 4, spellcheck: "false", placeholder: "Text or URL to encode…" });
  src.value = "https://mevebu.app";
  const size = el("input", { class: "tinput tnum", type: "number", min: "128", max: "1024", step: "16", value: "256" });
  const canvas = el("canvas", { class: "qrcanvas" });
  const note = el("div", { class: "tnote" }, "");
  let lastSvg = "";

  function render() {
    const text = src.value;
    if (!text) { note.textContent = "Type something to encode."; canvas.width = canvas.height = 0; return; }
    try {
      const qr = qrcode(0, "M");
      qr.addData(text);
      qr.make();
      const px = Math.max(128, Math.min(1024, parseInt(size.value || "256", 10)));
      const n = qr.getModuleCount();
      const quiet = 4;
      const cell = Math.floor(px / (n + quiet * 2));
      const dim = cell * (n + quiet * 2);
      canvas.width = canvas.height = dim;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, dim, dim);
      ctx.fillStyle = "#000000";
      for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++)
          if (qr.isDark(r, c)) ctx.fillRect((c + quiet) * cell, (r + quiet) * cell, cell, cell);
      lastSvg = qr.createSVGTag ? qr.createSVGTag(cell, false) : "";
      note.textContent = `v${""} ${n}×${n} modules · EC level M · byte mode`;
    } catch (e) {
      note.textContent = "⚠ " + (e.message || "Too much data for a QR code.");
    }
  }

  src.addEventListener("input", render);
  size.addEventListener("input", render);

  const copyPng = el("button", { class: "btn btn--ghost", type: "button" }, icon("copy"), "Copy PNG");
  const dlPng = el("button", { class: "btn btn--accent", type: "button" }, icon("download"), "Download PNG");
  const dlSvg = el("button", { class: "btn btn--ghost", type: "button" }, icon("download"), "Download SVG");

  copyPng.onclick = async () => {
    canvas.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        toast("QR copied ✓");
      } catch { toast("Clipboard image blocked — use Download."); }
    });
  };
  dlPng.onclick = () => canvas.toBlob((b) => b && download("qr.png", b, "image/png"));
  dlSvg.onclick = () => {
    if (!lastSvg) return toast("Nothing to export yet.");
    download("qr.svg", lastSvg, "image/svg+xml");
  };

  container.append(el("div", { class: "split split--wide-right" },
    el("div", { class: "tstack" },
      el("label", { class: "tfield" }, el("span", { class: "tfield__label" }, "Content"), src),
      el("label", { class: "tfield" }, el("span", { class: "tfield__label" }, "Size (px)"), size),
      el("div", { class: "trow trow--wrap" }, copyPng, dlPng, dlSvg)),
    el("div", { class: "center-col tstack" }, canvas, note)));
  render();
  return {};
}
export default { mount };
