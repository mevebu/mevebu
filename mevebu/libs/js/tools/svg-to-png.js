// An SVG rendered at whatever pixel size you ask for. The vector is drawn at
// that size, so the PNG is sharp instead of an upscaled bitmap.
import {
  el, toast, download, bench, stack, panel, numberInput, colorInput, checkbox,
  button, actions, toolcard, blank, notice, chipRow,
} from "../core.js";
import { dropzone, decodeImage, canvasToBlob, baseName, formatBytes } from "../files.js";

const PRESETS = [
  { value: "512", label: "512" },
  { value: "1024", label: "1024" },
  { value: "2048", label: "2048" },
];

export function mount(slot) {
  let file = null;
  let source = null;
  let previewUrl = "";
  let busy = false;
  let token = 0;
  let timer = null;

  const width = numberInput({ min: "8", max: "8192", step: "1", value: "512", "aria-label": "Width in pixels" });
  const height = numberInput({ min: "8", max: "8192", step: "1", value: "512", "aria-label": "Height in pixels" });
  const lock = checkbox("Keep proportions", { checked: true });
  const color = colorInput({ value: "#ffffff", "aria-label": "Background color" });
  const transparent = checkbox("Transparent background", { checked: true });
  const scale = chipRow(PRESETS.map((preset) => ({ value: preset.value, label: `${preset.label} px` })), {
    value: "512",
    label: "Preset size",
    onChange: (value) => {
      width.value = value;
      height.value = value;
      schedule();
    },
  });

  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const preview = el("img", { alt: "", class: "max-h-[380px] w-auto max-w-full rounded-r1 border border-orbit bg-[repeating-conic-gradient(#0000_0%_25%,var(--deck-2)_0%_50%)] bg-[length:16px_16px] object-contain" });
  const empty = blank("image-up", "Open an SVG to render it.");
  const previewBox = el("div", { class: "grid place-items-center rounded-r2 border border-orbit bg-deck-2 p-4" }, preview);

  const drop = dropzone({ label: "Drop an SVG here", accept: "image/svg+xml,.svg", iconName: "image-up" });
  const clearButton = button("Clear", { icon: "trash", kind: "quiet" });
  const saveButton = button("Download PNG", { icon: "download", kind: "fill" });

  function sync() {
    color.disabled = transparent.input.checked;
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(render, 200);
  }

  function reset() {
    token++;
    clearTimeout(timer);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = "";
    file = null;
    source = null;
    preview.removeAttribute("src");
    summary.textContent = "";
    error.write("");
    empty.hidden = false;
    previewBox.hidden = true;
    saveButton.disabled = true;
    clearButton.disabled = true;
  }

  async function open(files) {
    const picked = Array.from(files).find((entry) => entry.type === "image/svg+xml" || /\.svg$/i.test(entry.name));
    if (!picked) {
      error.write("That file is not an SVG.");
      return;
    }
    reset();
    const current = ++token;
    try {
      const bitmap = await decodeImage(picked);
      if (current !== token) return;
      source = bitmap;
      file = picked;
      const natural = Math.round(bitmap.width || bitmap.naturalWidth || 512);
      width.value = String(Math.min(4096, natural));
      height.value = String(Math.min(4096, Math.round(bitmap.height || bitmap.naturalHeight || natural)));
      empty.hidden = true;
      previewBox.hidden = false;
      saveButton.disabled = false;
      clearButton.disabled = false;
      error.write("");
      await render();
    } catch (caught) {
      if (current !== token) return;
      error.write(caught?.message || "This SVG could not be read.");
    }
  }

  async function render() {
    if (!source) return;
    const current = token;
    const w = Math.max(8, Math.min(8192, Number(width.value) || 512));
    const h = Math.max(8, Math.min(8192, Number(height.value) || 512));
    try {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const context = canvas.getContext("2d", { alpha: true });
      if (!transparent.input.checked) {
        context.fillStyle = color.value;
        context.fillRect(0, 0, w, h);
      }
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(source, 0, 0, w, h);
      if (current !== token) return;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(await canvasToBlob(canvas, "image/png"));
      preview.src = previewUrl;
      summary.textContent = `${w} x ${h} px · ${file.name}`;
    } catch (caught) {
      error.write(caught?.message || "Could not render this SVG.");
    }
  }

  async function save() {
    if (!source || busy) return;
    busy = true;
    saveButton.disabled = true;
    try {
      const w = Math.max(8, Math.min(8192, Number(width.value) || 512));
      const h = Math.max(8, Math.min(8192, Number(height.value) || 512));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const context = canvas.getContext("2d", { alpha: true });
      if (!transparent.input.checked) {
        context.fillStyle = color.value;
        context.fillRect(0, 0, w, h);
      }
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(source, 0, 0, w, h);
      const blob = await canvasToBlob(canvas, "image/png");
      download(`${baseName(file.name)}-${w}x${h}.png`, blob);
      summary.textContent = `${w} x ${h} px · ${formatBytes(blob.size)}`;
      toast("PNG ready");
    } catch (caught) {
      error.write(caught?.message || "Could not write the PNG.");
    } finally {
      busy = false;
      saveButton.disabled = false;
    }
  }

  drop.onFiles(open);
  width.addEventListener("input", () => {
    if (lock.input.checked) height.value = width.value;
    schedule();
  });
  height.addEventListener("input", () => {
    if (lock.input.checked) width.value = height.value;
    schedule();
  });
  transparent.input.addEventListener("change", () => {
    sync();
    schedule();
  });
  color.addEventListener("input", schedule);
  saveButton.addEventListener("click", save);
  clearButton.addEventListener("click", reset);
  sync();
  reset();

  const shell = toolcard({
    body: bench(
      stack(
        drop,
        panel("Preset", scale),
        el("div", { class: "grid grid-cols-2 gap-3" },
          panel("Width", width),
          panel("Height", height)),
        lock,
        el("div", { class: "grid gap-1.5" },
          el("span", { class: "text-sm font-semibold text-ink-2" }, "Background"),
          el("div", { class: "flex flex-wrap items-center gap-2" }, color, transparent)),
        error
      ),
      stack(summary, empty, previewBox)
    ),
    foot: actions(clearButton, saveButton),
  });

  slot.append(shell.node);

  return {
    unmount() {
      token++;
      clearTimeout(timer);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
  };
}

export default { mount };
