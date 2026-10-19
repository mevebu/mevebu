// One image becomes the full favicon set: a multi size ICO, the PNG sizes every
// platform asks for, a web manifest, and the tags that point at them. Everything
// is drawn on a canvas and zipped on this device.
import {
  el, icon, toast, download, bench, stack, panel, textInput, colorInput, checkbox,
  output, notice, blank, button, copyButton, actions, toolcard,
} from "../core.js";
import { zip } from "../zip.js";

const PNG_ICONS = [
  { name: "favicon-16x16.png", size: 16 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "favicon-48x48.png", size: 48 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "android-chrome-192x192.png", size: 192 },
  { name: "android-chrome-512x512.png", size: 512 },
];

const ICO_SIZES = [16, 32, 48];
const MASTER = 512;
const MAX_SIDE = 4096;
const MAX_PIXELS = 20_000_000;

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function looksLikeImage(file) {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|avif|gif|bmp|tiff?|svg|ico)$/i.test(file.name);
}

async function decode(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // SVG and a few odd files only decode through an <img>.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "sync";
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("This file is not an image the browser can read."));
      image.src = url;
    });
    return image;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function toBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("The browser could not write this PNG."))),
      "image/png"
    );
  });
}

function masterCanvas(source, background) {
  const width = source.width || source.naturalWidth;
  const height = source.height || source.naturalHeight;
  if (!width || !height) throw new Error("This image has no pixel size to read.");
  if (width > MAX_SIDE || height > MAX_SIDE || width * height > MAX_PIXELS) {
    throw new Error("This image is too large. Use one under 4096 px.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = MASTER;
  canvas.height = MASTER;
  const context = canvas.getContext("2d", { alpha: true });
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  if (background) {
    context.fillStyle = background;
    context.fillRect(0, 0, MASTER, MASTER);
  }
  const scale = Math.min(MASTER / width, MASTER / height);
  const drawWidth = width * scale;
  const drawHeight = height * scale;
  context.drawImage(source, (MASTER - drawWidth) / 2, (MASTER - drawHeight) / 2, drawWidth, drawHeight);
  if (source.close) source.close();
  return canvas;
}

function scaledPng(master, size) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { alpha: true });
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(master, 0, 0, size, size);
  return toBlob(canvas);
}

// ICO with PNG payloads. Vista and every current browser read this form, and it
// keeps the alpha channel that a BMP entry would need a second encoder for.
function buildIco(entries) {
  const header = 6 + entries.length * 16;
  const total = entries.reduce((sum, entry) => sum + entry.bytes.length, header);
  const buffer = new ArrayBuffer(total);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, entries.length, true);

  let offset = header;
  entries.forEach((entry, index) => {
    const at = 6 + index * 16;
    bytes[at] = entry.size >= 256 ? 0 : entry.size;
    bytes[at + 1] = entry.size >= 256 ? 0 : entry.size;
    bytes[at + 2] = 0;
    bytes[at + 3] = 0;
    view.setUint16(at + 4, 1, true);
    view.setUint16(at + 6, 32, true);
    view.setUint32(at + 8, entry.bytes.length, true);
    view.setUint32(at + 12, offset, true);
    bytes.set(entry.bytes, offset);
    offset += entry.bytes.length;
  });

  return bytes;
}

function manifest(background, name) {
  const color = background || "#ffffff";
  const app = name ? { name, short_name: name } : {};
  return JSON.stringify({
    ...app,
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    theme_color: color,
    background_color: color,
    display: "standalone",
  }, null, 2) + "\n";
}

const TAGS = [
  '<link rel="icon" href="/favicon.ico" sizes="any" />',
  '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />',
  '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />',
  '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />',
  '<link rel="manifest" href="/site.webmanifest" />',
].join("\n");

export function mount(slot) {
  let source = null;
  let sourceUrl = "";
  let files = [];
  let previews = [];
  let token = 0;
  let timer = null;

  const picker = el("input", { type: "file", accept: "image/*", class: "hidden" });
  const drop = el(
    "div",
    {
      class:
        "grid cursor-pointer justify-items-center gap-1.5 rounded-r2 border border-dashed border-orbit-hard bg-deck-2 px-4 py-7 text-center transition-[border-color,background-color] duration-150 hover:border-jade focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jade data-[drag]:border-jade data-[drag]:bg-jade-soft",
      role: "button",
      tabindex: "0",
      "aria-label": "Add an image",
    },
    icon("image-up", "size-6 text-ink-3"),
    el("p", { class: "text-sm font-semibold" }, "Drop an image here"),
    el("p", { class: "text-2xs text-ink-3" }, "or choose a file")
  );

  const preview = el("img", { alt: "", class: "hidden size-16 rounded-r1 border border-orbit bg-deck object-contain p-1" });
  const nameLine = el("p", { class: "truncate text-sm font-semibold" });

  const color = colorInput({ value: "#ffffff", "aria-label": "Background color" });
  const transparent = checkbox("Transparent", { checked: true });
  const backgroundRow = el(
    "div",
    { class: "flex min-w-0 flex-wrap items-center gap-2" },
    color,
    transparent
  );

  const appName = textInput({ placeholder: "My site", "aria-label": "App name" });

  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const grid = el("div", { class: "grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(92px,1fr))]" });
  const tags = output({ rows: 6 });
  const tagsPanel = el("div", { class: "grid gap-1.5" }, el("span", { class: "text-sm font-semibold text-ink-2" }, "HTML tags"), tags);
  const empty = blank("layout-grid", "Add an image to build the set.");

  const clearButton = button("Clear", { icon: "trash", kind: "quiet" });
  const downloadButton = button("Download .zip", { icon: "download", kind: "fill" });
  const copyTags = copyButton(() => tags.textContent, "Copy tags");

  function syncBackground() {
    color.disabled = transparent.input.checked;
  }

  function releasePreviews() {
    for (const url of previews) URL.revokeObjectURL(url);
    previews = [];
  }

  function render() {
    if (!source) {
      grid.hidden = true;
      tagsPanel.hidden = true;
      empty.hidden = false;
      summary.textContent = "";
      downloadButton.disabled = true;
      copyTags.disabled = true;
      preview.classList.add("hidden");
      nameLine.textContent = "";
      return;
    }
    empty.hidden = true;
    preview.classList.remove("hidden");
    nameLine.textContent = source.name;
    grid.hidden = false;
    tagsPanel.hidden = false;
    downloadButton.disabled = !files.length;
    copyTags.disabled = !files.length;
  }

  function paintPreview(blobs) {
    releasePreviews();
    grid.replaceChildren(...PNG_ICONS.map(({ name, size }) => {
      const blob = blobs.get(name);
      const url = URL.createObjectURL(blob);
      previews.push(url);
      return el(
        "figure",
        { class: "m-0 grid justify-items-center gap-1 rounded-r1 border border-orbit bg-deck-2 p-2" },
        el("img", {
          src: url,
          alt: "",
          width: Math.min(size, 48),
          height: Math.min(size, 48),
          class: "object-contain",
        }),
        el("figcaption", { class: "text-2xs tabular-nums text-ink-3" }, `${size} × ${size}`)
      );
    }));
  }

  async function run() {
    if (!source) return;
    const current = ++token;
    error.write("");
    downloadButton.disabled = true;
    copyTags.disabled = true;
    summary.textContent = "Building the set";

    try {
      const image = await decode(source.file);
      if (current !== token) return;
      const background = transparent.input.checked ? "" : color.value;
      const master = masterCanvas(image, background);
      const blobs = new Map();
      for (const { name, size } of PNG_ICONS) {
        blobs.set(name, await scaledPng(master, size));
        if (current !== token) return;
      }

      const pngBytes = new Map();
      for (const [name, blob] of blobs) pngBytes.set(name, new Uint8Array(await blob.arrayBuffer()));
      const ico = buildIco(ICO_SIZES.map((size) => ({
        size,
        bytes: pngBytes.get(`favicon-${size}x${size}.png`),
      })));
      const manifestBytes = new TextEncoder().encode(manifest(background, appName.value.trim()));

      files = [
        { name: "favicon.ico", bytes: ico },
        ...PNG_ICONS.map(({ name }) => ({ name, bytes: pngBytes.get(name) })),
        { name: "site.webmanifest", bytes: manifestBytes },
      ];
      const total = files.reduce((sum, file) => sum + file.bytes.length, 0);
      summary.textContent = `${files.length} files · ${formatBytes(total)}`;
      tags.write(TAGS);
      paintPreview(blobs);
      render();
    } catch (caught) {
      if (current !== token) return;
      files = [];
      summary.textContent = "";
      tags.write("");
      grid.replaceChildren();
      releasePreviews();
      error.write(caught?.message || "Could not build the icon set.");
      render();
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(run, 180);
  }

  function useFile(file) {
    if (!file) return;
    if (!looksLikeImage(file)) {
      error.write("That file is not an image.");
      return;
    }
    token++;
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    source = { file, name: file.name };
    sourceUrl = URL.createObjectURL(file);
    preview.src = sourceUrl;
    files = [];
    error.write("");
    tags.write("");
    summary.textContent = "";
    grid.replaceChildren();
    releasePreviews();
    render();
    schedule();
  }

  function clearAll() {
    token++;
    clearTimeout(timer);
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    source = null;
    sourceUrl = "";
    files = [];
    preview.removeAttribute("src");
    grid.replaceChildren();
    tags.write("");
    releasePreviews();
    error.write("");
    render();
  }

  picker.addEventListener("change", () => {
    useFile(picker.files?.[0] ?? null);
    picker.value = "";
  });

  drop.addEventListener("click", () => picker.click());
  drop.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      picker.click();
    }
  });

  let dragDepth = 0;
  drop.addEventListener("dragenter", (event) => {
    event.preventDefault();
    dragDepth++;
    drop.dataset.drag = "";
  });
  drop.addEventListener("dragover", (event) => event.preventDefault());
  drop.addEventListener("dragleave", () => {
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) delete drop.dataset.drag;
  });
  drop.addEventListener("drop", (event) => {
    event.preventDefault();
    dragDepth = 0;
    delete drop.dataset.drag;
    useFile(event.dataTransfer?.files?.[0] ?? null);
  });

  transparent.input.addEventListener("change", () => {
    syncBackground();
    schedule();
  });
  color.addEventListener("input", schedule);
  appName.addEventListener("input", schedule);

  clearButton.addEventListener("click", clearAll);
  downloadButton.addEventListener("click", () => {
    if (!files.length) return toast("Nothing to save yet");
    download("favicon.zip", zip(files), "application/zip");
  });

  syncBackground();
  render();

  const shell = toolcard({
    body: bench(
      stack(
        drop,
        picker,
        el(
          "div",
          { class: "flex min-w-0 items-center gap-3" },
          preview,
          el("div", { class: "min-w-0" }, nameLine)
        ),
        el(
          "div",
          { class: "grid min-w-0 content-start gap-1.5" },
          el("span", { class: "text-sm font-semibold text-ink-2" }, "Background"),
          backgroundRow
        ),
        panel("App name", appName),
        error
      ),
      stack(summary, empty, grid, tagsPanel)
    ),
    foot: actions(clearButton, copyTags, downloadButton),
  });

  slot.append(shell.node);

  return {
    unmount() {
      token++;
      clearTimeout(timer);
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      releasePreviews();
    },
  };
}

export default { mount };
