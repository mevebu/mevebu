// Plain text into a PDF with real page breaks. Lines are wrapped against the
// chosen font's own metrics, so nothing runs off the margin.
import {
  el, toast, download, bench, stack, panel, textArea, textInput, selectInput,
  numberInput, button, actions, toolcard, notice, checkbox,
} from "../core.js";
import { loadPdfLib } from "../pdf-engine.js";
import { formatBytes } from "../files.js";

const PAGES = {
  a4: { label: "A4", width: 595.28, height: 841.89 },
  letter: { label: "Letter", width: 612, height: 792 },
};

const SAMPLE = `mevebu

Small tools that run in your browser.
No account, no upload, no tracking.

Paste your own text here, then press Build PDF.`;

export function mount(slot) {
  let busy = false;
  let token = 0;

  const body = textArea({ rows: 14, value: SAMPLE, "aria-label": "Text" });
  const title = textInput({ placeholder: "Optional title", "aria-label": "Title" });
  const size = selectInput(
    Object.entries(PAGES).map(([value, page]) => ({ value, label: page.label })),
    { value: "a4", "aria-label": "Page size" }
  );
  const margin = numberInput({ min: "18", max: "108", step: "6", value: "54", "aria-label": "Margin in points" });
  const fontSize = numberInput({ min: "8", max: "24", step: "1", value: "11", "aria-label": "Font size" });
  const leading = numberInput({ min: "1", max: "2.5", step: "0.1", value: "1.5", "aria-label": "Line height" });
  const numbers = checkbox("Page numbers", { checked: true });

  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const buildButton = button("Build PDF", { icon: "file-text", kind: "fill" });

  function wrap(text, font, maxWidth, sizeValue) {
    const lines = [];
    for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
      if (!raw.trim()) {
        lines.push("");
        continue;
      }
      const words = raw.split(/\s+/);
      let line = "";
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, sizeValue) <= maxWidth) {
          line = candidate;
          continue;
        }
        if (line) lines.push(line);
        // A single word longer than the line is cut by character.
        if (font.widthOfTextAtSize(word, sizeValue) <= maxWidth) {
          line = word;
          continue;
        }
        let piece = "";
        for (const char of word) {
          if (font.widthOfTextAtSize(piece + char, sizeValue) > maxWidth) {
            lines.push(piece);
            piece = char;
          } else piece += char;
        }
        line = piece;
      }
      lines.push(line);
    }
    return lines;
  }

  async function build() {
    const text = body.value;
    if (!text.trim() || busy) {
      error.write("Write something first.");
      return;
    }
    busy = true;
    const current = ++token;
    buildButton.disabled = true;
    summary.textContent = "Building the PDF";
    error.write("");
    try {
      const { PDFDocument, StandardFonts, rgb } = await loadPdfLib();
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const bold = await doc.embedFont(StandardFonts.HelveticaBold);
      const page = PAGES[size.value] ?? PAGES.a4;
      const inset = Math.max(0, Number(margin.value) || 54);
      const sizeValue = Math.max(6, Number(fontSize.value) || 11);
      const step = sizeValue * Math.max(1, Number(leading.value) || 1.5);
      const maxWidth = page.width - inset * 2;

      let sheet = doc.addPage([page.width, page.height]);
      let y = page.height - inset;

      const heading = title.value.trim();
      if (heading) {
        sheet.drawText(heading, { x: inset, y: y - sizeValue * 1.6, size: sizeValue * 1.6, font: bold, color: rgb(0.05, 0.05, 0.05) });
        y -= sizeValue * 1.6 + step * 0.8;
      }

      for (const line of wrap(text, font, maxWidth, sizeValue)) {
        if (y - step < inset) {
          sheet = doc.addPage([page.width, page.height]);
          y = page.height - inset;
        }
        if (line) {
          sheet.drawText(line, { x: inset, y: y - sizeValue, size: sizeValue, font, color: rgb(0.1, 0.1, 0.1) });
        }
        y -= step;
      }

      if (numbers.input.checked) {
        const total = doc.getPageCount();
        doc.getPages().forEach((pageNode, index) => {
          const label = `${index + 1} / ${total}`;
          const width = font.widthOfTextAtSize(label, 8);
          pageNode.drawText(label, {
            x: (page.width - width) / 2,
            y: inset / 2,
            size: 8,
            font,
            color: rgb(0.45, 0.45, 0.45),
          });
        });
      }

      const bytes = await doc.save();
      const name = `${(heading || "document").replace(/[^\w -]+/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "document"}.pdf`;
      download(name, new Blob([bytes], { type: "application/pdf" }));
      summary.textContent = `${doc.getPageCount()} page${doc.getPageCount() === 1 ? "" : "s"} · ${formatBytes(bytes.length)}`;
      toast("PDF ready");
    } catch (caught) {
      summary.textContent = "";
      error.write(caught?.message || "Could not build the PDF.");
    } finally {
      if (current === token) {
        busy = false;
        buildButton.disabled = false;
      }
    }
  }

  buildButton.addEventListener("click", build);

  const shell = toolcard({
    body: bench(
      stack(
        panel("Text", body),
        panel("Title", title, "Optional. Sits at the top of the first page."),
        panel("Page size", size),
        el("div", { class: "grid grid-cols-2 gap-3" },
          panel("Margin", margin),
          panel("Font size", fontSize)),
        panel("Line height", leading),
        numbers,
        error
      ),
      stack(summary,
        el("div", { class: "grid gap-2 rounded-r2 border border-orbit bg-deck-2 p-4 text-sm leading-[1.6] text-ink-2" },
          el("p", { class: "m-0 font-semibold text-ink" }, "What you get"),
          el("p", { class: "m-0" }, "A PDF with selectable text, wrapped to the margin, with real page breaks."),
          el("p", { class: "m-0 text-ink-3" }, "The font is Helvetica, which every PDF reader already has, so the file stays small.")))
    ),
    foot: actions(buildButton),
  });

  slot.append(shell.node);

  return {
    unmount() {
      token++;
    },
  };
}

export default { mount };
