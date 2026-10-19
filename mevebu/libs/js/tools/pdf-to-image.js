// Every page of a PDF as its own image. pdf.js draws the page on a canvas, the
// canvas writes PNG or JPEG, and the set leaves as one ZIP.
import {
  el, toast, download, bench, stack, panel, selectInput, numberInput, rangeInput,
  button, actions, toolcard, blank, notice, chipRow,
} from "../core.js";
import { dropzone, canvasToBlob, baseName, formatBytes } from "../files.js";
import { readPdfjs, parsePageRange } from "../pdf-engine.js";
import { zip } from "../zip.js";

export function mount(slot) {
  let file = null;
  let pdf = null;
  let token = 0;
  let busy = false;

  const range = el("input", {
    class: "w-full min-h-[var(--ctl)] rounded-r1 border border-orbit bg-deck px-3 py-2.5 font-mono text-sm focus:border-jade focus:outline-none focus:ring-3 focus:ring-jade-soft",
    type: "text",
    placeholder: "all",
    spellcheck: "false",
    autocomplete: "off",
    "aria-label": "Page range",
  });
  const format = selectInput(
    [
      { value: "png", label: "PNG" },
      { value: "jpeg", label: "JPEG" },
    ],
    { value: "png", "aria-label": "Image format" }
  );
  const scale = rangeInput({ min: "1", max: "3", step: "0.5", value: "2", "aria-label": "Scale" });
  const scaleLabel = el("span", { class: "text-sm font-semibold text-ink-2 tabular-nums" }, "2x");
  const quality = rangeInput({ min: "50", max: "100", step: "5", value: "88", "aria-label": "JPEG quality" });
  const qualityLabel = el("span", { class: "text-sm font-semibold text-ink-2 tabular-nums" }, "88");
  const qualityRow = el("div", { class: "grid gap-1.5" }, quality, qualityLabel);

  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const preview = el("div", { class: "grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]" });
  const empty = blank("file-text", "Open a PDF to render its pages.");

  const drop = dropzone({ label: "Drop a PDF here", accept: "application/pdf,.pdf", iconName: "file-text" });

  const clearButton = button("Clear", { icon: "trash", kind: "quiet" });
  const downloadButton = button("Download ZIP", { icon: "download", kind: "fill" });

  function sync() {
    const jpeg = format.value === "jpeg";
    qualityRow.hidden = !jpeg;
    qualityLabel.textContent = `${quality.value}%`;
    scaleLabel.textContent = `${Number(scale.value).toFixed(1).replace(/\.0$/, "")}x`;
  }

  function reset() {
    token++;
    file = null;
    pdf = null;
    preview.replaceChildren();
    summary.textContent = "";
    error.write("");
    empty.hidden = false;
    downloadButton.disabled = true;
    clearButton.disabled = true;
  }

  async function open(files) {
    const picked = Array.from(files).find((entry) => entry.type === "application/pdf" || /\.pdf$/i.test(entry.name));
    if (!picked) {
      error.write("That file is not a PDF.");
      return;
    }
    reset();
    const current = ++token;
    summary.textContent = "Reading the PDF";
    try {
      const doc = await readPdfjs(picked);
      if (current !== token) return;
      file = picked;
      pdf = doc;
      summary.textContent = `${picked.name} · ${doc.numPages} page${doc.numPages === 1 ? "" : "s"} · ${formatBytes(picked.size)}`;
      empty.hidden = true;
      downloadButton.disabled = false;
      clearButton.disabled = false;
      error.write("");
      await renderPreview();
    } catch (caught) {
      if (current !== token) return;
      summary.textContent = "";
      error.write(caught?.message || "This PDF could not be read.");
    }
  }

  async function renderPreview() {
    if (!pdf) return;
    const current = token;
    const pages = Math.min(pdf.numPages, 6);
    const nodes = [];
    for (let index = 0; index < pages; index++) {
      const page = await pdf.getPage(index + 1);
      if (current !== token) return;
      const viewport = page.getViewport({ scale: 0.4 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
      nodes.push(
        el("figure", { class: "m-0 grid gap-1.5" },
          el("img", { src: canvas.toDataURL("image/png"), alt: `Page ${index + 1}`, class: "w-full rounded-r1 border border-orbit bg-deck" }),
          el("figcaption", { class: "text-2xs text-ink-3" }, `Page ${index + 1}`))
      );
    }
    preview.replaceChildren(...nodes);
  }

  async function run() {
    if (!pdf || busy) return;
    busy = true;
    const current = ++token;
    downloadButton.disabled = true;
    summary.textContent = "Rendering pages";
    error.write("");
    try {
      const indexes = parsePageRange(range.value, pdf.numPages);
      const type = format.value === "jpeg" ? "image/jpeg" : "image/png";
      const ext = format.value === "jpeg" ? "jpg" : "png";
      const base = baseName(file.name);
      const files = [];
      for (const [position, index] of indexes.entries()) {
        if (current !== token) return;
        const page = await pdf.getPage(index + 1);
        const viewport = page.getViewport({ scale: Number(scale.value) });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        const blob = await canvasToBlob(canvas, type, type === "image/jpeg" ? Number(quality.value) / 100 : undefined);
        const pageNumber = String(index + 1).padStart(String(pdf.numPages).length, "0");
        files.push({ name: `${base}-page-${pageNumber}.${ext}`, bytes: new Uint8Array(await blob.arrayBuffer()) });
        summary.textContent = `Rendering page ${position + 1} of ${indexes.length}`;
      }
      const total = files.reduce((sum, entry) => sum + entry.bytes.length, 0);
      download(`${base}-images.zip`, zip(files), "application/zip");
      summary.textContent = `${files.length} image${files.length === 1 ? "" : "s"} · ${formatBytes(total)}`;
      toast("Images ready");
    } catch (caught) {
      summary.textContent = "";
      error.write(caught?.message || "Could not render the pages.");
    } finally {
      if (current === token) {
        busy = false;
        downloadButton.disabled = false;
      }
    }
  }

  drop.onFiles(open);
  format.addEventListener("change", sync);
  scale.addEventListener("input", sync);
  quality.addEventListener("input", sync);
  downloadButton.addEventListener("click", run);
  clearButton.addEventListener("click", reset);
  sync();
  reset();

  const shell = toolcard({
    body: bench(
      stack(
        drop,
        panel("Pages", range, "1-3, 7, 10- . Empty means every page."),
        panel("Format", format),
        el("div", { class: "grid gap-1.5" }, el("span", { class: "text-sm font-semibold text-ink-2" }, "Scale"), scale, scaleLabel),
        el("div", { class: "grid gap-1.5" }, el("span", { class: "text-sm font-semibold text-ink-2" }, "JPEG quality"), qualityRow),
        error
      ),
      stack(summary, empty, preview)
    ),
    foot: actions(clearButton, downloadButton),
  });

  slot.append(shell.node);

  return {
    unmount() {
      token++;
    },
  };
}

export default { mount };
