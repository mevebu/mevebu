// A QR code from text or a link. PNG for chat, SVG for print. The quiet zone
// and the size cap keep the code scannable at any setting.
import { el, toast, download, downloadButton, bench, stack, panel, textArea, numberInput, notice, button, actions, toolcard } from "../core.js";
import qrcode from "../vendor/qrcode-generator.mjs";

export function mount(slot) {
  const content = textArea({ rows: 4, "aria-label": "Text or link" });
  const sizeField = numberInput({ value: "256", min: "120", max: "1024", step: "8", "aria-label": "Size in pixels" });
  const canvas = el("canvas", { class: "h-auto w-[min(300px,100%)] [image-rendering:pixelated]", role: "img", "aria-label": "QR code" });
  const reading = el("p", { class: "border-s-[3px] border-transparent ps-2 text-sm text-ink-3" });
  const error = notice("error");
  let svg = "";

  function pixelSize() {
    return Math.max(120, Math.min(1024, parseInt(sizeField.value || "256", 10) || 256));
  }

  function render() {
    error.write("");
    const text = content.value;
    if (!text) {
      canvas.width = 0;
      canvas.height = 0;
      reading.textContent = "Type something to make a code.";
      svg = "";
      return;
    }
    try {
      const code = qrcode(0, "M");
      code.addData(text);
      code.make();
      const pixels = pixelSize();
      const modules = code.getModuleCount();
      const quiet = 4;
      const cell = Math.max(1, Math.floor(pixels / (modules + quiet * 2)));
      const side = cell * (modules + quiet * 2);
      canvas.width = side;
      canvas.height = side;
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, side, side);
      context.fillStyle = "#000000";
      for (let row = 0; row < modules; row++) {
        for (let col = 0; col < modules; col++) {
          if (code.isDark(row, col)) context.fillRect((col + quiet) * cell, (row + quiet) * cell, cell, cell);
        }
      }
      svg = typeof code.createSVGTag === "function" ? code.createSVGTag(cell, false) : "";
      reading.textContent = "";
    } catch (caught) {
      error.write(caught?.message || "That text is too long for a QR code.");
    }
  }

  content.addEventListener("input", render);
  sizeField.addEventListener("input", render);
  sizeField.addEventListener("change", () => {
    sizeField.value = String(pixelSize());
    render();
  });

  // An empty field leaves a zero sized canvas, so a save would write an empty
  // file and a copy would put nothing on the clipboard.
  const noCode = () => !content.value.trim();

  const pngButton = button("Save PNG", { icon: "download", kind: "fill" });
  const svgButton = downloadButton(() => svg, "qr.svg", "Save SVG", "image/svg+xml");
  const copyButton = button("Copy image", { icon: "copy" });

  pngButton.addEventListener("click", () => {
    if (noCode()) return toast("Nothing to save yet");
    canvas.toBlob((blob) => blob && download("qr.png", blob, "image/png"));
  });
  copyButton.addEventListener("click", () => {
    if (noCode()) return toast("Nothing to copy yet");
    canvas.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        toast("Copied");
      } catch {
        toast("This browser blocks image copying. Save the PNG instead.");
      }
    });
  });

  const card = toolcard({
    body: bench(
      stack(panel("Text or link", content), panel("Size in pixels", sizeField), error),
      stack(panel("Preview", canvas), reading)
    ),
    foot: actions(copyButton, svgButton, pngButton)});
  slot.append(card.node);
  render();

  return {};
}

export default { mount };