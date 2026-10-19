// File plumbing shared by the converter tools: a drop target, a size label, a
// name without its extension, and an image decoder. Kept here so ten tools do
// not each grow their own copy.
import { el, icon } from "./core.js";

export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function baseName(name) {
  return (name || "file").replace(/\.[^.]+$/, "") || "file";
}

export function extension(name) {
  const match = /\.([^.]+)$/.exec(name || "");
  return match ? match[1].toLowerCase() : "";
}

/** A dashed drop zone. Calls `onFiles` with a FileList or an array of files. */
export function dropzone({ label, hint = "or choose a file", accept = "", multiple = false, iconName = "image-up" }) {
  const picker = el("input", { type: "file", accept, multiple, class: "hidden" });
  const node = el(
    "div",
    {
      class:
        "grid cursor-pointer justify-items-center gap-1.5 rounded-r2 border border-dashed border-orbit-hard bg-deck-2 px-4 py-7 text-center transition-[border-color,background-color] duration-150 hover:border-jade focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jade data-[drag]:border-jade data-[drag]:bg-jade-soft",
      role: "button",
      tabindex: "0",
      "aria-label": label,
    },
    icon(iconName, "size-6 text-ink-3"),
    el("p", { class: "text-sm font-semibold" }, label),
    el("p", { class: "text-2xs text-ink-3" }, hint),
    picker
  );

  let handler = () => {};
  let depth = 0;

  node.addEventListener("click", () => picker.click());
  node.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      picker.click();
    }
  });
  picker.addEventListener("change", () => {
    if (picker.files?.length) handler(picker.files);
    picker.value = "";
  });
  node.addEventListener("dragenter", (event) => {
    event.preventDefault();
    depth++;
    node.dataset.drag = "";
  });
  node.addEventListener("dragover", (event) => event.preventDefault());
  node.addEventListener("dragleave", () => {
    depth = Math.max(0, depth - 1);
    if (!depth) delete node.dataset.drag;
  });
  node.addEventListener("drop", (event) => {
    event.preventDefault();
    depth = 0;
    delete node.dataset.drag;
    const files = Array.from(event.dataTransfer?.files ?? []);
    if (files.length) handler(files);
  });

  node.onFiles = (fn) => {
    handler = fn;
  };
  node.picker = picker;
  return node;
}

/** Decodes an image file, preferring createImageBitmap and falling back to <img>. */
export async function decodeImage(file) {
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

export function imageSize(source) {
  return {
    width: source.width || source.naturalWidth || 0,
    height: source.height || source.naturalHeight || 0,
  };
}

export function canvasToBlob(canvas, type = "image/png", quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("The browser could not write this file."))),
      type,
      quality
    );
  });
}

/** Sorts files by name with numbers read as numbers, so page-2 comes before page-10. */
export function naturalSort(files) {
  return [...files].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
  );
}
