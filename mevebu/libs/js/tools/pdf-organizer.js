// Reorder, rotate and delete pages. Thumbnails come from pdf.js, the saved file
// from pdf-lib, and the two never touch the network.
import {
  el, icon, toast, download, bench, stack, panel, button, actions, toolcard,
  blank, notice,
} from "../core.js";
import { dropzone, baseName, formatBytes } from "../files.js";
import { loadPdfLib, loadPdfjs } from "../pdf-engine.js";

export function mount(slot) {
  let file = null;
  let source = null;
  let pages = [];
  let busy = false;
  let token = 0;

  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const grid = el("div", { class: "grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(170px,1fr))]" });
  const empty = blank("layout-grid", "Open a PDF to rearrange its pages.");

  const drop = dropzone({ label: "Drop a PDF here", accept: "application/pdf,.pdf", iconName: "file-text" });
  const clearButton = button("Clear", { icon: "trash", kind: "quiet" });
  const saveButton = button("Save PDF", { icon: "download", kind: "fill" });

  function reset() {
    token++;
    file = null;
    source = null;
    pages = [];
    grid.replaceChildren();
    summary.textContent = "";
    error.write("");
    empty.hidden = false;
    saveButton.disabled = true;
    clearButton.disabled = true;
  }

  function render() {
    empty.hidden = pages.length > 0;
    saveButton.disabled = pages.length === 0 || busy;
    clearButton.disabled = pages.length === 0 || busy;
    summary.textContent = file
      ? `${file.name} · ${pages.length} page${pages.length === 1 ? "" : "s"} left · ${formatBytes(file.size)}`
      : "";

    const cards = pages.map((page, index) => {
      const thumb = el("img", {
        src: page.thumb,
        alt: `Page ${page.original}`,
        class: "w-full rounded-[5px] border border-orbit bg-deck transition-transform duration-150",
        style: `transform: rotate(${page.rotation}deg)`,
      });
      const badge = el("span", {
        class: "absolute top-1 start-1 rounded-full bg-ink px-1.5 py-0.5 text-2xs font-bold text-void tabular-nums",
      }, String(index + 1));

      const small = (label, iconName, extra, disabled, onclick) =>
        el("button", {
          class: `inline-flex size-7 cursor-pointer items-center justify-center rounded-[5px] border-0 bg-transparent text-ink-3 hover:bg-deck disabled:opacity-40 ${extra}`,
          type: "button",
          "aria-label": label,
          disabled,
          onclick,
        }, icon(iconName, "size-3.5"));

      return el(
        "figure",
        {
          class: "m-0 grid gap-2 rounded-r1 border border-orbit bg-deck-2 p-2",
          draggable: "true",
          ondragstart: (event) => {
            event.dataTransfer.setData("text/plain", String(index));
            event.dataTransfer.effectAllowed = "move";
          },
          ondragover: (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          },
          ondrop: (event) => {
            event.preventDefault();
            move(Number(event.dataTransfer.getData("text/plain")), index);
          },
        },
        el("div", { class: "relative" }, thumb, badge),
        el("div", { class: "grid gap-1.5" },
          el("span", { class: "text-2xs text-ink-3 tabular-nums" }, `from ${page.original}`),
          el("div", { class: "flex items-center justify-between gap-0.5" },
            small(`Move page ${index + 1} left`, "chevron-right", "rotate-180 hover:text-ink", index === 0, () => move(index, index - 1)),
            small(`Move page ${index + 1} right`, "chevron-right", "hover:text-ink", index === pages.length - 1, () => move(index, index + 1)),
            small(`Rotate page ${index + 1}`, "rotate-cw", "hover:text-ink", false, () => rotate(index)),
            small(`Delete page ${index + 1}`, "trash", "hover:text-danger", false, () => remove(index))))
      );
    });

    grid.replaceChildren(...cards);
  }

  function move(from, to) {
    if (!Number.isInteger(from) || from === to || from < 0 || from >= pages.length) return;
    const [page] = pages.splice(from, 1);
    pages.splice(Math.max(0, Math.min(pages.length, to)), 0, page);
    render();
  }

  function rotate(index) {
    const page = pages[index];
    page.rotation = (page.rotation + 90) % 360;
    render();
  }

  function remove(index) {
    pages.splice(index, 1);
    render();
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
      const [pdfjs, lib] = await Promise.all([loadPdfjs(), loadPdfLib()]);
      const bytes = new Uint8Array(await picked.arrayBuffer());
      const doc = await pdfjs.getDocument({ data: bytes.slice(), isEvalSupported: false }).promise;
      const editable = await lib.PDFDocument.load(bytes);
      if (current !== token) return;
      file = picked;
      source = editable;

      const thumbs = [];
      for (let index = 0; index < doc.numPages; index++) {
        const page = await doc.getPage(index + 1);
        const viewport = page.getViewport({ scale: 0.35 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        const rotation = editable.getPage(index).getRotation().angle % 360;
        thumbs.push({ original: index + 1, rotation, thumb: canvas.toDataURL("image/png") });
        summary.textContent = `Reading page ${index + 1} of ${doc.numPages}`;
      }
      if (current !== token) return;
      pages = thumbs;
      error.write("");
      render();
    } catch (caught) {
      if (current !== token) return;
      summary.textContent = "";
      error.write(caught?.message || "This PDF could not be read.");
    }
  }

  async function save() {
    if (!source || !pages.length || busy) return;
    busy = true;
    const current = ++token;
    saveButton.disabled = true;
    summary.textContent = "Writing the PDF";
    error.write("");
    try {
      const { PDFDocument, degrees } = await loadPdfLib();
      const out = await PDFDocument.create();
      const copied = await out.copyPages(source, pages.map((page) => page.original - 1));
      copied.forEach((page, index) => {
        page.setRotation(degrees(pages[index].rotation));
        out.addPage(page);
      });
      const bytes = await out.save();
      download(`${baseName(file.name)}-edited.pdf`, new Blob([bytes], { type: "application/pdf" }));
      summary.textContent = `${out.getPageCount()} pages · ${formatBytes(bytes.length)}`;
      toast("PDF saved");
    } catch (caught) {
      summary.textContent = "";
      error.write(caught?.message || "Could not save the PDF.");
    } finally {
      if (current === token) {
        busy = false;
        render();
      }
    }
  }

  drop.onFiles(open);
  saveButton.addEventListener("click", save);
  clearButton.addEventListener("click", reset);
  reset();

  const shell = toolcard({
    body: bench(
      stack(
        drop,
        panel("How to use", el("p", { class: "m-0 text-sm leading-[1.6] text-ink-3" },
          "Drag a page to move it, or use the arrows. The rotate button turns it 90 degrees clockwise. Delete removes it from the copy, never from your file.")),
        error
      ),
      stack(summary, empty, grid)
    ),
    foot: actions(clearButton, saveButton),
  });

  slot.append(shell.node);

  return {
    unmount() {
      token++;
    },
  };
}

export default { mount };
