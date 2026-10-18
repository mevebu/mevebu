// Image to image conversion, in batch and entirely on the device. Canvas writes
// JPEG, PNG, WebP and AVIF; TIFF and BMP come from the two small encoders below,
// because no browser can write either of them.
import {
  el, icon, toast, download, bench, stack, panel, selectInput, rangeInput, numberInput,
  button, actions, toolcard, blank, notice,
} from "../core.js";

const FORMATS = [
  { id: "jpeg", label: "JPEG", mime: "image/jpeg", ext: "jpg", quality: true },
  { id: "png", label: "PNG", mime: "image/png", ext: "png", quality: false },
  { id: "webp", label: "WebP", mime: "image/webp", ext: "webp", quality: true },
  { id: "avif", label: "AVIF", mime: "image/avif", ext: "avif", quality: true },
  { id: "tiff", label: "TIFF", mime: "image/tiff", ext: "tiff", quality: false, encode: encodeTiff },
  { id: "bmp", label: "BMP", mime: "image/bmp", ext: "bmp", quality: false, encode: encodeBmp },
];

const MAX_SIDE = 16384;
const MAX_PIXELS = 80_000_000;

function writable(mime) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL(mime).startsWith(`data:${mime}`);
}

const AVAILABLE = FORMATS.filter((format) => format.encode || writable(format.mime));

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function baseName(name) {
  return name.replace(/\.[^.]+$/, "") || "image";
}

function inputFormat(file) {
  const type = (file.type || "").split("/")[1];
  if (type) return type.replace("svg+xml", "SVG").replace("vnd.microsoft.icon", "ICO").toUpperCase();
  const ext = (file.name.split(".").pop() || "").toUpperCase();
  return ext || "Image";
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
      // Some formats, SVG among them, only decode through an <img>.
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

async function convert(file, format, quality) {
  const source = await decode(file);
  const width = source.width || source.naturalWidth;
  const height = source.height || source.naturalHeight;
  if (!width || !height) throw new Error("This image has no pixel size to read.");
  if (width > MAX_SIDE || height > MAX_SIDE || width * height > MAX_PIXELS) {
    throw new Error("This image is too large to convert here.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: true });
  // JPEG and BMP have no usable alpha, so a transparent pixel would turn black.
  if (format.id === "jpeg" || format.id === "bmp") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(source, 0, 0);
  if (source.close) source.close();

  if (format.encode) {
    return format.encode(context.getImageData(0, 0, width, height));
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("The browser could not encode this image."))),
      format.mime,
      format.quality ? quality / 100 : undefined
    );
  });
}

// Baseline TIFF, uncompressed RGBA. Every tag is written by hand because the
// format needs strip offsets and rational resolutions that a canvas never gives.
function encodeTiff(image) {
  const { data, width, height } = image;
  const samples = 4;
  const pixels = new Uint8Array(width * height * samples);
  for (let i = 0, j = 0; i < data.length; i += 4, j += samples) {
    pixels[j] = data[i];
    pixels[j + 1] = data[i + 1];
    pixels[j + 2] = data[i + 2];
    pixels[j + 3] = data[i + 3];
  }

  const entries = [
    [256, 4, 1, width],
    [257, 4, 1, height],
    [258, 3, samples, 0],
    [259, 3, 1, 1],
    [262, 3, 1, 2],
    [273, 4, 1, 0],
    [277, 3, 1, samples],
    [278, 4, 1, height],
    [279, 4, 1, pixels.length],
    [282, 5, 1, 0],
    [283, 5, 1, 0],
    [296, 3, 1, 2],
    [338, 3, 1, 1],
  ];

  const ifdSize = 2 + entries.length * 12 + 4;
  const bitsAt = 8 + ifdSize;
  const xResAt = bitsAt + samples * 2;
  const yResAt = xResAt + 8;
  const pixelsAt = yResAt + 8;
  const buffer = new ArrayBuffer(pixelsAt + pixels.length);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  view.setUint16(0, 0x4949, true);
  view.setUint16(2, 42, true);
  view.setUint32(4, 8, true);
  view.setUint16(8, entries.length, true);

  let at = 10;
  for (const [tag, type, count, value] of entries) {
    view.setUint16(at, tag, true);
    view.setUint16(at + 2, type, true);
    view.setUint32(at + 4, count, true);
    let inline = value;
    if (tag === 258) inline = bitsAt;
    else if (tag === 273) inline = pixelsAt;
    else if (tag === 282) inline = xResAt;
    else if (tag === 283) inline = yResAt;
    if (type === 3 && count === 1) view.setUint16(at + 8, inline, true);
    else view.setUint32(at + 8, inline, true);
    at += 12;
  }
  view.setUint32(at, 0, true);

  for (let i = 0; i < samples; i++) view.setUint16(bitsAt + i * 2, 8, true);
  view.setUint32(xResAt, 72, true);
  view.setUint32(xResAt + 4, 1, true);
  view.setUint32(yResAt, 72, true);
  view.setUint32(yResAt + 4, 1, true);
  bytes.set(pixels, pixelsAt);

  return new Blob([buffer], { type: "image/tiff" });
}

// 24-bit BMP, bottom up, rows padded to four bytes.
function encodeBmp(image) {
  const { data, width, height } = image;
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelSize = rowSize * height;
  const buffer = new ArrayBuffer(54 + pixelSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  bytes[0] = 0x42;
  bytes[1] = 0x4d;
  view.setUint32(2, buffer.byteLength, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, pixelSize, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);

  for (let y = 0; y < height; y++) {
    const from = y * width * 4;
    const to = 54 + (height - 1 - y) * rowSize;
    for (let x = 0; x < width; x++) {
      const i = from + x * 4;
      const o = to + x * 3;
      bytes[o] = data[i + 2];
      bytes[o + 1] = data[i + 1];
      bytes[o + 2] = data[i];
    }
  }
  return new Blob([buffer], { type: "image/bmp" });
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Store only. The images are already compressed, so deflating them again would
// cost time and save nothing.
function zip(files) {
  const now = new Date();
  const time = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff;
  const date = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const file of files) {
    const name = new TextEncoder().encode(file.name);
    const data = new Uint8Array(file.bytes);
    const crc = crc32(data);

    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, time, true);
    lv.setUint16(12, date, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, name.length, true);
    local.set(name, 30);

    const entry = new Uint8Array(46 + name.length);
    const cv = new DataView(entry.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, time, true);
    cv.setUint16(14, date, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    entry.set(name, 46);

    chunks.push(local, data);
    central.push(entry);
    offset += local.length + data.length;
  }

  const centralSize = central.reduce((total, entry) => total + entry.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);

  return new Blob([...chunks, ...central, end], { type: "application/zip" });
}

export function mount(slot) {
  const entries = [];
  let nextId = 1;
  let runToken = 0;
  let timer = null;
  let busy = false;

  const picker = el("input", { type: "file", accept: "image/*", multiple: true, class: "hidden" });
  const drop = el(
    "div",
    {
      class:
        "grid cursor-pointer justify-items-center gap-1.5 rounded-r2 border border-dashed border-orbit-hard bg-deck-2 px-4 py-7 text-center transition-[border-color,background-color] duration-150 hover:border-jade focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jade data-[drag]:border-jade data-[drag]:bg-jade-soft",
      role: "button",
      tabindex: "0",
      "aria-label": "Add images",
    },
    icon("image-up", "size-6 text-ink-3"),
    el("p", { class: "text-sm font-semibold" }, "Drop images here"),
    el("p", { class: "text-2xs text-ink-3" }, "or choose files")
  );

  const target = selectInput(
    AVAILABLE.map((format) => ({ value: format.id, label: format.label })),
    { value: AVAILABLE.some((format) => format.id === "webp") ? "webp" : "jpeg", "aria-label": "Convert to" }
  );

  const qualityRange = rangeInput({ min: "10", max: "100", step: "1", value: "85", "aria-label": "Quality percent" });
  const qualityNumber = numberInput({ min: "10", max: "100", step: "1", value: "85", "aria-label": "Quality percent" });
  const qualityRow = el(
    "div",
    { class: "flex min-w-0 items-center gap-3" },
    el("div", { class: "min-w-0 flex-1" }, qualityRange),
    qualityNumber
  );
  const qualityHint = el("span", { class: "text-2xs text-ink-3" });
  const qualityPanel = el(
    "div",
    { class: "grid min-w-0 content-start gap-1.5" },
    el("span", { class: "text-sm font-semibold text-ink-2" }, "Quality"),
    qualityRow,
    qualityHint
  );

  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const grid = el("div", { class: "grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]" });
  const empty = blank("image-up", "Add an image to convert it.");

  const clearAll = button("Clear all", { icon: "trash" });
  const downloadAll = button("Download all", { icon: "download", kind: "fill" });

  function currentFormat() {
    return AVAILABLE.find((format) => format.id === target.value) ?? AVAILABLE[0];
  }

  function syncQuality() {
    const format = currentFormat();
    const lossy = Boolean(format.quality);
    qualityRange.disabled = !lossy;
    qualityNumber.disabled = !lossy;
    qualityPanel.classList.toggle("opacity-50", !lossy);
    qualityHint.textContent = lossy
      ? `Applies to ${format.label}. Lower means a smaller file.`
      : `${format.label} is lossless, so there is no quality to set.`;
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(run, 220);
  }

  function outputName(entry, format) {
    const base = baseName(entry.file.name);
    const used = new Set(entries.filter((other) => other !== entry && other.outName).map((other) => other.outName));
    let name = `${base}.${format.ext}`;
    let index = 2;
    while (used.has(name)) {
      name = `${base}-${index}.${format.ext}`;
      index++;
    }
    return name;
  }

  async function run() {
    if (!entries.length) return;
    const token = ++runToken;
    const format = currentFormat();
    const quality = Math.max(10, Math.min(100, parseInt(qualityNumber.value || "85", 10) || 85));
    busy = true;
    error.write("");
    downloadAll.disabled = true;
    clearAll.disabled = true;

    for (const entry of entries) {
      if (token !== runToken) return;
      entry.status = "working";
      entry.blob = null;
      entry.error = "";
      entry.outName = "";
    }
    render();

    for (const [index, entry] of entries.entries()) {
      if (token !== runToken) return;
      summary.textContent = `Converting ${index + 1} of ${entries.length}`;
      try {
        const blob = await convert(entry.file, format, quality);
        if (token !== runToken) return;
        entry.blob = blob;
        entry.outName = outputName(entry, format);
        entry.status = "done";
      } catch (caught) {
        if (token !== runToken) return;
        entry.error = caught?.message || "Could not convert this file.";
        entry.status = "error";
      }
      render();
    }

    if (token !== runToken) return;
    busy = false;
    downloadAll.disabled = false;
    clearAll.disabled = false;
    render();
  }

  // Two lines, so a unit never breaks in half at the card edge.
  function metaLines(entry) {
    const format = currentFormat();
    const from = `${inputFormat(entry.file)} · ${formatBytes(entry.file.size)}`;
    if (entry.status === "error") return [from, entry.error];
    if (entry.status === "working") return [from, `Converting to ${format.label}`];
    if (entry.status === "done") {
      return [from, `to ${format.label} · ${formatBytes(entry.blob.size)}`];
    }
    return [from, `to ${format.label}`];
  }

  function fileCard(entry) {
    const remove = button("", {
      icon: "x",
      kind: "quiet",
      class:
        "absolute end-1 top-1 size-8 rounded-full border border-orbit bg-deck/90 text-ink-2 hover:border-danger hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-danger",
      "aria-label": `Remove ${entry.file.name}`,
    });
    remove.addEventListener("click", () => removeEntry(entry));

    const save = button("Save", { icon: "download", class: "w-full" });
    save.disabled = entry.status !== "done";
    save.addEventListener("click", () => {
      if (entry.blob) download(entry.outName, entry.blob, entry.blob.type);
    });

    return el(
      "div",
      { class: "grid content-start gap-2 rounded-r2 border border-orbit bg-deck-2 p-2" },
      el(
        "div",
        { class: "relative" },
        el("img", {
          src: entry.url,
          alt: "",
          class: "aspect-[4/3] w-full rounded-r1 bg-deck object-contain",
        }),
        remove
      ),
      el(
        "div",
        { class: "min-w-0" },
        el("p", { class: "truncate text-sm font-semibold", title: entry.file.name }, entry.file.name),
        el(
          "p",
          { class: `mt-0.5 grid gap-0.5 text-2xs tabular-nums ${entry.status === "error" ? "text-danger" : "text-ink-3"}` },
          ...metaLines(entry).map((line) => el("span", { class: "truncate" }, line))
        )
      ),
      save
    );
  }

  function render() {
    grid.replaceChildren(...entries.map(fileCard));
    const done = entries.filter((entry) => entry.status === "done");
    const before = done.reduce((total, entry) => total + entry.file.size, 0);
    const after = done.reduce((total, entry) => total + entry.blob.size, 0);
    if (!entries.length) {
      summary.textContent = "";
      grid.hidden = true;
      empty.hidden = false;
    } else {
      grid.hidden = false;
      empty.hidden = true;
      if (busy) {
        // The loop writes the counter itself.
      } else {
        const failed = entries.length - done.length;
        const size = done.length ? ` · ${formatBytes(before)} → ${formatBytes(after)}` : "";
        const trouble = failed ? ` · ${failed} failed` : "";
        summary.textContent = `${entries.length} image${entries.length === 1 ? "" : "s"}${size}${trouble}`;
      }
    }
    downloadAll.disabled = busy || !done.length;
    clearAll.disabled = busy || !entries.length;
  }

  function removeEntry(entry) {
    const index = entries.indexOf(entry);
    if (index < 0) return;
    entries.splice(index, 1);
    URL.revokeObjectURL(entry.url);
    if (!entries.length) {
      runToken++;
      busy = false;
      summary.textContent = "";
    }
    render();
    if (entries.length) schedule();
  }

  function addFiles(files) {
    const images = [];
    let skipped = 0;
    for (const file of files) {
      if (looksLikeImage(file)) images.push(file);
      else skipped++;
    }
    error.write(skipped ? `${skipped} file${skipped === 1 ? "" : "s"} skipped. Only images can be converted.` : "");
    if (!images.length) return;
    for (const file of images) {
      entries.push({
        id: nextId++,
        file,
        url: URL.createObjectURL(file),
        status: "queued",
        blob: null,
        error: "",
        outName: "",
      });
    }
    render();
    schedule();
  }

  picker.addEventListener("change", () => {
    addFiles(Array.from(picker.files ?? []));
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
    addFiles(Array.from(event.dataTransfer?.files ?? []));
  });

  target.addEventListener("change", () => {
    syncQuality();
    schedule();
  });
  qualityRange.addEventListener("input", () => {
    qualityNumber.value = qualityRange.value;
    schedule();
  });
  qualityNumber.addEventListener("input", () => {
    const value = parseInt(qualityNumber.value || "", 10);
    if (Number.isFinite(value)) qualityRange.value = String(Math.max(10, Math.min(100, value)));
    schedule();
  });
  qualityNumber.addEventListener("change", () => {
    const value = Math.max(10, Math.min(100, parseInt(qualityNumber.value || "85", 10) || 85));
    qualityNumber.value = String(value);
    qualityRange.value = String(value);
    schedule();
  });

  clearAll.addEventListener("click", () => {
    runToken++;
    clearTimeout(timer);
    busy = false;
    for (const entry of entries) URL.revokeObjectURL(entry.url);
    entries.length = 0;
    error.write("");
    render();
  });

  downloadAll.addEventListener("click", () => {
    const done = entries.filter((entry) => entry.status === "done" && entry.blob);
    if (!done.length) return toast("Nothing to save yet");
    if (done.length === 1) {
      download(done[0].outName, done[0].blob, done[0].blob.type);
      return;
    }
    Promise.all(done.map(async (entry) => ({ name: entry.outName, bytes: await entry.blob.arrayBuffer() })))
      .then((files) => download(`mevebu-images-${currentFormat().ext}.zip`, zip(files), "application/zip"))
      .catch(() => toast("Could not build the ZIP"));
  });

  syncQuality();
  render();

  const shell = toolcard({
    body: bench(
      stack(
        drop,
        picker,
        panel("Convert to", target),
        qualityPanel,
        error
      ),
      stack(
        summary,
        empty,
        grid
      )
    ),
    foot: actions(clearAll, downloadAll),
  });

  slot.append(shell.node);

  return {
    unmount() {
      runToken++;
      clearTimeout(timer);
      for (const entry of entries) URL.revokeObjectURL(entry.url);
      entries.length = 0;
    },
  };
}

export default { mount };
