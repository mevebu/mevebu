// The text layer of a PDF, page by page. pdf.js exposes the text items with
// their positions, so lines are rebuilt from the vertical gap rather than from
// the order the items happen to arrive in.
import {
  el, toast, download, bench, stack, panel, button, actions, toolcard, blank,
  notice, output, copyButton,
} from "../core.js";
import { dropzone, baseName, formatBytes } from "../files.js";
import { readPdfjs, parsePageRange } from "../pdf-engine.js";

function joinItems(items) {
  const lines = [];
  let current = null;
  let lastY = null;

  for (const item of items) {
    const text = item.str ?? "";
    if (!text) continue;
    const y = Math.round(item.transform?.[5] ?? 0);
    if (lastY === null || Math.abs(y - lastY) > 2) {
      if (current !== null) lines.push(current.trimEnd());
      current = text;
      lastY = y;
    } else {
      const needsSpace = current && !/\s$/.test(current) && !/^\s/.test(text);
      current += (needsSpace ? " " : "") + text;
    }
  }
  if (current !== null) lines.push(current.trimEnd());
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function mount(slot) {
  let file = null;
  let pdf = null;
  let text = "";
  let busy = false;
  let token = 0;

  const range = el("input", {
    class: "w-full min-h-[var(--ctl)] rounded-r1 border border-orbit bg-deck px-3 py-2.5 font-mono text-sm focus:border-jade focus:outline-none focus:ring-3 focus:ring-jade-soft",
    type: "text",
    placeholder: "all",
    spellcheck: "false",
    autocomplete: "off",
    "aria-label": "Page range",
  });

  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const result = output({ rows: 16 });
  const empty = blank("file-text", "Open a PDF to read its text.");

  const drop = dropzone({ label: "Drop a PDF here", accept: "application/pdf,.pdf", iconName: "file-text" });
  const clearButton = button("Clear", { icon: "trash", kind: "quiet" });
  const extractButton = button("Extract text", { icon: "text-search", kind: "fill" });
  const copy = copyButton(() => text, "Copy text");

  function reset() {
    token++;
    file = null;
    pdf = null;
    text = "";
    result.write("");
    summary.textContent = "";
    error.write("");
    empty.hidden = false;
    extractButton.disabled = true;
    clearButton.disabled = true;
    copy.disabled = true;
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
      extractButton.disabled = false;
      clearButton.disabled = false;
      error.write("");
    } catch (caught) {
      if (current !== token) return;
      summary.textContent = "";
      error.write(caught?.message || "This PDF could not be read.");
    }
  }

  async function extract() {
    if (!pdf || busy) return;
    busy = true;
    const current = ++token;
    extractButton.disabled = true;
    summary.textContent = "Reading the text layer";
    error.write("");
    try {
      const indexes = parsePageRange(range.value, pdf.numPages);
      const blocks = [];
      for (const [position, index] of indexes.entries()) {
        if (current !== token) return;
        const page = await pdf.getPage(index + 1);
        const content = await page.getTextContent();
        const body = joinItems(content.items);
        blocks.push(`--- page ${index + 1} ---\n${body || "(no text on this page)"}`);
        summary.textContent = `Page ${position + 1} of ${indexes.length}`;
      }
      text = blocks.join("\n\n");
      result.write(text);
      const words = text.split(/\s+/).filter(Boolean).length;
      summary.textContent = `${indexes.length} page${indexes.length === 1 ? "" : "s"} · ${words} words`;
      copy.disabled = false;
      if (!words) error.write("No text layer here. This looks like a scan, so there is nothing to copy.");
      else toast("Text ready");
    } catch (caught) {
      summary.textContent = "";
      error.write(caught?.message || "Could not read the text.");
    } finally {
      if (current === token) {
        busy = false;
        extractButton.disabled = false;
      }
    }
  }

  drop.onFiles(open);
  extractButton.addEventListener("click", extract);
  clearButton.addEventListener("click", reset);
  reset();

  const shell = toolcard({
    body: bench(
      stack(
        drop,
        panel("Pages", range, "1-3, 7, 10- . Empty means every page."),
        error,
        el("p", { class: "m-0 text-2xs leading-[1.6] text-ink-3" },
          "A scanned page is an image, so it has no text to read. Run it through an OCR tool first.")
      ),
      stack(summary, empty, result)
    ),
    foot: actions(clearButton, copy,
      el("button", {
        class: "inline-flex min-h-[var(--ctl)] cursor-pointer items-center justify-center gap-2 rounded-r1 border border-orbit bg-deck px-4 text-sm font-semibold whitespace-nowrap text-ink transition-colors duration-150 hover:border-orbit-hard hover:bg-deck-2 disabled:opacity-50",
        type: "button",
        onclick: () => {
          if (!text) return;
          download(`${baseName(file?.name || "document")}.txt`, text, "text/plain");
        },
      }, "Download .txt"),
      extractButton),
  });

  slot.append(shell.node);

  return {
    unmount() {
      token++;
    },
  };
}

export default { mount };
