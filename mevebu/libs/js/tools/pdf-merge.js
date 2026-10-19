// Several PDFs into one. Pages are copied as they are, so the text stays
// selectable and nothing is re-rendered.
import {
  el, icon, toast, download, bench, stack, panel, button, actions, toolcard, blank, notice,
} from "../core.js";
import { dropzone, baseName, formatBytes } from "../files.js";
import { loadPdfLib, readPdfLib } from "../pdf-engine.js";

export function mount(slot) {
  const entries = [];
  let nextId = 1;
  let busy = false;
  let token = 0;

  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const list = el("div", { class: "grid gap-2" });
  const empty = blank("file-text", "Add two or more PDFs to merge them.");

  const drop = dropzone({ label: "Drop PDFs here", accept: "application/pdf,.pdf", multiple: true, iconName: "file-text" });
  const clearButton = button("Clear", { icon: "trash", kind: "quiet" });
  const mergeButton = button("Merge PDFs", { icon: "combine", kind: "fill" });

  function render() {
    empty.hidden = entries.length > 0;
    list.hidden = entries.length === 0;
    mergeButton.disabled = entries.length < 2 || busy;
    clearButton.disabled = entries.length === 0 || busy;
    const pages = entries.reduce((sum, entry) => sum + entry.pages, 0);
    const bytes = entries.reduce((sum, entry) => sum + entry.file.size, 0);
    summary.textContent = entries.length
      ? `${entries.length} files · ${pages} pages · ${formatBytes(bytes)}`
      : "";
    list.replaceChildren(
      ...entries.map((entry, index) =>
        el(
          "div",
          { class: "flex min-w-0 items-center gap-3 rounded-r1 border border-orbit bg-deck-2 p-2.5" },
          el("span", { class: "grid size-9 flex-none place-items-center rounded-[5px] bg-jade-soft text-jade" }, icon("file-text", "size-4")),
          el("div", { class: "min-w-0 flex-1" },
            el("p", { class: "truncate text-sm font-semibold" }, entry.file.name),
            el("p", { class: "text-2xs text-ink-3" }, `${entry.pages} page${entry.pages === 1 ? "" : "s"} · ${formatBytes(entry.file.size)}`)),
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
            }, icon("x", "size-4"))))
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
    if (at >= 0) entries.splice(at, 1);
    render();
  }

  async function add(files) {
    const pdfs = Array.from(files).filter((file) => file.type === "application/pdf" || /\.pdf$/i.test(file.name));
    if (!pdfs.length) {
      error.write("Those files are not PDFs.");
      return;
    }
    error.write("");
    for (const file of pdfs) {
      try {
        const doc = await readPdfLib(file);
        entries.push({ id: nextId++, file, pages: doc.getPageCount() });
      } catch (caught) {
        error.write(`${file.name}: ${caught.message || "could not be read"}`);
      }
    }
    render();
  }

  async function merge() {
    if (entries.length < 2 || busy) return;
    busy = true;
    const current = ++token;
    mergeButton.disabled = true;
    summary.textContent = "Merging";
    error.write("");
    try {
      const { PDFDocument } = await loadPdfLib();
      const merged = await PDFDocument.create();
      for (const entry of entries) {
        if (current !== token) return;
        const source = await PDFDocument.load(await entry.file.arrayBuffer());
        const pages = await merged.copyPages(source, source.getPageIndices());
        for (const page of pages) merged.addPage(page);
      }
      const bytes = await merged.save();
      const name = entries.length === 1 ? entries[0].file.name : "merged.pdf";
      download(name, new Blob([bytes], { type: "application/pdf" }));
      summary.textContent = `${merged.getPageCount()} pages · ${formatBytes(bytes.length)}`;
      toast("Merged");
    } catch (caught) {
      summary.textContent = "";
      error.write(caught?.message || "Could not merge these files.");
    } finally {
      if (current === token) {
        busy = false;
        render();
      }
    }
  }

  drop.onFiles(add);
  mergeButton.addEventListener("click", merge);
  clearButton.addEventListener("click", () => {
    entries.length = 0;
    error.write("");
    render();
  });

  render();

  const shell = toolcard({
    body: bench(
      stack(drop, panel("Order", el("p", { class: "m-0 text-sm text-ink-3" }, "Files merge from top to bottom.")), error),
      stack(summary, empty, list)
    ),
    foot: actions(clearButton, mergeButton),
  });

  slot.append(shell.node);

  return {
    unmount() {
      token++;
    },
  };
}

export default { mount };
