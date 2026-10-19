// Images into one PDF. Every picture is redrawn at the page's pixel size and
// embedded as JPEG, so a 40 MB phone photo becomes a normal page instead of a
// 40 MB document.
import {
  el, icon, toast, download, bench, stack, panel, selectInput, numberInput,
  button, actions, toolcard, blank, notice, chipRow,
} from "../core.js";
import { dropzone, decodeImage, imageSize, canvasToBlob, baseName, formatBytes } from "../files.js";
import { loadPdfLib } from "../pdf-engine.js";

const PAGES = {
  a4: { label: "A4", width: 595.28, height: 841.89 },
  letter: { label: "Letter", width: 612, height: 792 },
};

const DPI = 150;

function pageSize(key) {
  const preset = PAGES[key] ?? PAGES.a4;
  return { width: preset.width, height: preset.height };
}

function drawImage(source, targetWidth, targetHeight, fit) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(targetWidth));
  canvas.height = Math.max(1, Math.round(targetHeight));
  const context = canvas.getContext("2d", { alpha: false });
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  const { width, height } = imageSize(source);
  if (!width || !height) throw new Error("This image has no pixel size to read.");

  const scale = fit === "cover"
    ? Math.max(canvas.width / width, canvas.height / height)
    : Math.min(canvas.width / width, canvas.height / height);
  const drawWidth = width * scale;
  const drawHeight = height * scale;
  context.drawImage(
    source,
    (canvas.width - drawWidth) / 2,
    (canvas.height - drawHeight) / 2,
    drawWidth,
    drawHeight
  );
  return canvas;
}

export function mount(slot) {
  const entries = [];
  let nextId = 1;
  let token = 0;
  let timer = null;
  let busy = false;

  const size = selectInput(
    Object.entries(PAGES).map(([value, page]) => ({ value, label: `${page.label} (${Math.round(page.width)} x ${Math.round(page.height)} pt)` })),
    { value: "a4", "aria-label": "Page size" }
  );
  const margin = numberInput({ min: "0", max: "96", step: "2", value: "24", "aria-label": "Margin in points" });
  const fit = chipRow(
    [
      { value: "contain", label: "Fit inside" },
      { value: "cover", label: "Fill page" },
    ],
    { value: "contain", label: "Image fit" }
  );

  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const list = el("div", { class: "grid gap-2" });
  const empty = blank("image-up", "Add images to build a PDF.");

  const drop = dropzone({
    label: "Drop images here",
    hint: "PNG, JPEG, WebP, GIF, BMP, SVG",
    accept: "image/*",
    multiple: true,
    iconName: "image-up",
  });

  const clearAll = button("Clear", { icon: "trash", kind: "quiet" });
  const buildButton = button("Build PDF", { icon: "file-text", kind: "fill" });

  function render() {
    empty.hidden = entries.length > 0;
    list.hidden = entries.length === 0;
    buildButton.disabled = entries.length === 0 || busy;
    clearAll.disabled = entries.length === 0 || busy;
    const bytes = entries.reduce((sum, entry) => sum + entry.file.size, 0);
    summary.textContent = entries.length
      ? `${entries.length} image${entries.length === 1 ? "" : "s"} · ${formatBytes(bytes)} in`
      : "";
    list.replaceChildren(
      ...entries.map((entry, index) =>
        el(
          "div",
          { class: "flex min-w-0 items-center gap-3 rounded-r1 border border-orbit bg-deck-2 p-2" },
          el("img", { src: entry.url, alt: "", class: "size-12 flex-none rounded-[5px] border border-orbit bg-deck object-cover" }),
          el(
            "div",
            { class: "min-w-0 flex-1" },
            el("p", { class: "truncate text-sm font-semibold" }, entry.file.name),
            el("p", { class: "text-2xs text-ink-3" }, `${entry.width} x ${entry.height} · ${formatBytes(entry.file.size)}`)
          ),
          el("div", { class: "flex flex-none items-center gap-0.5" },
            el("button", {
              class: "inline-flex size-8 cursor-pointer items-center justify-center rounded-[5px] border-0 bg-transparent text-ink-3 hover:bg-deck hover:text-ink disabled:opacity-40",
              type: "button",
              "aria-label": `Move ${entry.file.name} up`,
              disabled: index === 0,
              onclick: () => move(index, -1),
            }, icon("chevron-right", "size-4 -rotate-90")),
            el("button", {
              class: "inline-flex size-8 cursor-pointer items-center justify-center rounded-[5px] border-0 bg-transparent text-ink-3 hover:bg-deck hover:text-ink disabled:opacity-40",
              type: "button",
              "aria-label": `Move ${entry.file.name} down`,
              disabled: index === entries.length - 1,
              onclick: () => move(index, 1),
            }, icon("chevron-right", "size-4 rotate-90")),
            el("button", {
              class: "inline-flex size-8 cursor-pointer items-center justify-center rounded-[5px] border-0 bg-transparent text-ink-3 hover:bg-deck hover:text-danger",
              type: "button",
              "aria-label": `Remove ${entry.file.name}`,
              onclick: () => remove(entry.id),
            }, icon("x", "size-4"))
          )
        )
      )
    );
  }

  function move(index, delta) {
    const next = index + delta;
    if (next < 0 || next >= entries.length) return;
    [entries[index], entries[next]] = [entries[next], entries[index]];
    render();
  }

  function remove(id) {
    const at = entries.findIndex((entry) => entry.id === id);
    if (at < 0) return;
    URL.revokeObjectURL(entries[at].url);
    entries.splice(at, 1);
    render();
  }

  async function add(files) {
    const images = Array.from(files).filter((file) => file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(file.name));
    if (!images.length) {
      error.write("Those files are not images.");
      return;
    }
    error.write("");
    for (const file of images) {
      try {
        const bitmap = await decodeImage(file);
        const { width, height } = imageSize(bitmap);
        if (bitmap.close) bitmap.close();
        entries.push({ id: nextId++, file, url: URL.createObjectURL(file), width, height });
      } catch (caught) {
        error.write(`${file.name}: ${caught.message}`);
      }
    }
    render();
  }

  async function build() {
    if (!entries.length || busy) return;
    busy = true;
    const current = ++token;
    buildButton.disabled = true;
    summary.textContent = "Building the PDF";
    error.write("");
    try {
      const { PDFDocument } = await loadPdfLib();
      const doc = await PDFDocument.create();
      const { width, height } = pageSize(size.value);
      const inset = Math.max(0, Number(margin.value) || 0);
      const areaWidth = Math.max(24, width - inset * 2);
      const areaHeight = Math.max(24, height - inset * 2);

      for (const entry of entries) {
        if (current !== token) return;
        const source = await decodeImage(entry.file);
        const canvas = drawImage(source, (areaWidth / 72) * DPI, (areaHeight / 72) * DPI, fit.value);
        if (source.close) source.close();
        const jpeg = await canvasToBlob(canvas, "image/jpeg", 0.9);
        const image = await doc.embedJpg(await jpeg.arrayBuffer());
        const page = doc.addPage([width, height]);
        page.drawImage(image, { x: inset, y: inset, width: areaWidth, height: areaHeight });
      }

      const bytes = await doc.save();
      const name = entries.length === 1 ? `${baseName(entries[0].file.name)}.pdf` : "images.pdf";
      download(name, new Blob([bytes], { type: "application/pdf" }));
      summary.textContent = `${entries.length} page${entries.length === 1 ? "" : "s"} · ${formatBytes(bytes.length)}`;
      toast("PDF ready");
    } catch (caught) {
      summary.textContent = "";
      error.write(caught?.message || "Could not build the PDF.");
    } finally {
      if (current === token) {
        busy = false;
        render();
      }
    }
  }

  drop.onFiles(add);
  buildButton.addEventListener("click", build);
  clearAll.addEventListener("click", () => {
    for (const entry of entries) URL.revokeObjectURL(entry.url);
    entries.length = 0;
    error.write("");
    render();
  });

  render();

  const shell = toolcard({
    body: bench(
      stack(
        drop,
        panel("Page size", size),
        panel("Margin", margin, "In points. 72 points make an inch."),
        el("div", { class: "grid gap-1.5" },
          el("span", { class: "text-sm font-semibold text-ink-2" }, "Image fit"),
          fit,
          el("span", { class: "text-2xs text-ink-3" }, "Fit inside keeps the whole image. Fill page crops the edges.")),
        error
      ),
      stack(summary, empty, list)
    ),
    foot: actions(clearAll, buildButton),
  });

  slot.append(shell.node);

  return {
    unmount() {
      token++;
      clearTimeout(timer);
      for (const entry of entries) URL.revokeObjectURL(entry.url);
    },
  };
}

export default { mount };
