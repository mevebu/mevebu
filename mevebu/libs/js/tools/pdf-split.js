// One PDF into several. Split by ranges, by a fixed page count, or one file per
// page, then take the parts as a ZIP.
import {
  el, toast, download, bench, stack, panel, numberInput, button, actions,
  toolcard, blank, notice, chipRow,
} from "../core.js";
import { dropzone, baseName, formatBytes } from "../files.js";
import { loadPdfLib, readPdfLib, parsePageRange } from "../pdf-engine.js";
import { zip } from "../zip.js";

export function mount(slot) {
  let file = null;
  let doc = null;
  let busy = false;
  let token = 0;

  let splitMode = "ranges";
  const mode = chipRow(
    [
      { value: "ranges", label: "By range" },
      { value: "every", label: "Every N pages" },
      { value: "single", label: "One per page" },
    ],
    {
      value: "ranges",
      label: "Split mode",
      onChange: (value) => {
        splitMode = value;
        sync();
      },
    }
  );

  const rangeInput = el("input", {
    class: "w-full min-h-[var(--ctl)] rounded-r1 border border-orbit bg-deck px-3 py-2.5 font-mono text-sm focus:border-jade focus:outline-none focus:ring-3 focus:ring-jade-soft",
    type: "text",
    placeholder: "1-4, 5-8",
    spellcheck: "false",
    autocomplete: "off",
    "aria-label": "Ranges",
  });
  const rangePanel = panel("Ranges", rangeInput, "One part per range, separated by commas.");

  const every = numberInput({ min: "1", max: "500", step: "1", value: "2", "aria-label": "Pages per part" });
  const everyPanel = panel("Pages per part", every);
  everyPanel.hidden = true;

  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const parts = el("div", { class: "grid gap-2" });
  const empty = blank("file-text", "Open a PDF to split it.");

  const drop = dropzone({ label: "Drop a PDF here", accept: "application/pdf,.pdf", iconName: "file-text" });
  const clearButton = button("Clear", { icon: "trash", kind: "quiet" });
  const splitButton = button("Split and download", { icon: "download", kind: "fill" });

  function sync() {
    rangePanel.hidden = splitMode !== "ranges";
    everyPanel.hidden = splitMode !== "every";
  }

  function reset() {
    token++;
    file = null;
    doc = null;
    parts.replaceChildren();
    summary.textContent = "";
    error.write("");
    empty.hidden = false;
    splitButton.disabled = true;
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
      const parsed = await readPdfLib(picked);
      if (current !== token) return;
      file = picked;
      doc = parsed;
      summary.textContent = `${picked.name} · ${parsed.getPageCount()} page${parsed.getPageCount() === 1 ? "" : "s"} · ${formatBytes(picked.size)}`;
      empty.hidden = true;
      splitButton.disabled = false;
      clearButton.disabled = false;
      error.write("");
    } catch (caught) {
      if (current !== token) return;
      summary.textContent = "";
      error.write(caught?.message || "This PDF could not be read.");
    }
  }

  async function split() {
    if (!doc || busy) return;
    busy = true;
    const current = ++token;
    splitButton.disabled = true;
    summary.textContent = "Splitting";
    error.write("");
    try {
      const { PDFDocument } = await loadPdfLib();
      const count = doc.getPageCount();
      const base = baseName(file.name);
      const groups = [];

      if (splitMode === "every") {
        const step = Math.max(1, Number(every.value) || 1);
        for (let start = 0; start < count; start += step) {
          groups.push({
            label: `${start + 1}-${Math.min(count, start + step)}`,
            pages: Array.from({ length: Math.min(step, count - start) }, (_, i) => start + i),
          });
        }
      } else if (splitMode === "single") {
        for (let index = 0; index < count; index++) groups.push({ label: `${index + 1}`, pages: [index] });
      } else {
        const text = rangeInput.value.trim();
        if (!text) throw new Error("Write at least one range, for example 1-4, 5-8.");
        for (const part of text.split(",")) {
          const piece = part.trim();
          if (!piece) continue;
          const pages = parsePageRange(piece, count);
          groups.push({ label: piece.replace(/\s+/g, ""), pages });
        }
      }

      if (!groups.length) throw new Error("That split selects no pages.");

      const files = [];
      for (const [index, group] of groups.entries()) {
        if (current !== token) return;
        const out = await PDFDocument.create();
        const copied = await out.copyPages(doc, group.pages);
        for (const page of copied) out.addPage(page);
        const bytes = await out.save();
        files.push({ name: `${base}-${group.label}.pdf`, bytes });
        summary.textContent = `Writing part ${index + 1} of ${groups.length}`;
      }

      const total = files.reduce((sum, entry) => sum + entry.bytes.length, 0);
      download(`${base}-parts.zip`, zip(files), "application/zip");
      summary.textContent = `${files.length} part${files.length === 1 ? "" : "s"} · ${formatBytes(total)}`;
      parts.replaceChildren(
        ...files.map((entry) =>
          el("div", { class: "flex items-center justify-between gap-3 rounded-r1 border border-orbit bg-deck-2 px-3 py-2" },
            el("span", { class: "truncate font-mono text-sm" }, entry.name),
            el("span", { class: "flex-none text-2xs text-ink-3 tabular-nums" }, formatBytes(entry.bytes.length)))
        )
      );
      toast("Parts ready");
    } catch (caught) {
      summary.textContent = "";
      error.write(caught?.message || "Could not split this file.");
    } finally {
      if (current === token) {
        busy = false;
        splitButton.disabled = false;
      }
    }
  }

  drop.onFiles(open);
  splitButton.addEventListener("click", split);
  clearButton.addEventListener("click", reset);
  sync();
  reset();

  const shell = toolcard({
    body: bench(
      stack(
        drop,
        el("div", { class: "grid gap-1.5" }, el("span", { class: "text-sm font-semibold text-ink-2" }, "Split mode"), mode),
        rangePanel,
        everyPanel,
        error
      ),
      stack(summary, empty, parts)
    ),
    foot: actions(clearButton, splitButton),
  });

  slot.append(shell.node);

  return {
    unmount() {
      token++;
    },
  };
}

export default { mount };
