// Loaders for the two vendored PDF libraries. Each one is fetched the first time
// a tool needs it, so opening the index never downloads a PDF engine.
const PDFJS_URL = new URL("./vendor/pdf.min.mjs", import.meta.url).href;
const WORKER_URL = new URL("./vendor/pdf.worker.min.mjs", import.meta.url).href;
const PDFLIB_URL = new URL("./vendor/pdf-lib.min.js", import.meta.url).href;

let pdfjsPromise = null;
let pdfLibPromise = null;

/** pdf.js, configured to run its worker from this folder, never from a CDN. */
export function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import(PDFJS_URL).then((module) => {
      module.GlobalWorkerOptions.workerSrc = WORKER_URL;
      return module;
    });
  }
  return pdfjsPromise;
}

/** pdf-lib, which ships as a UMD bundle and lands on `globalThis.PDFLib`. */
export function loadPdfLib() {
  if (globalThis.PDFLib) return Promise.resolve(globalThis.PDFLib);
  if (!pdfLibPromise) {
    pdfLibPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = PDFLIB_URL;
      script.onload = () =>
        globalThis.PDFLib ? resolve(globalThis.PDFLib) : reject(new Error("The PDF writer did not start."));
      script.onerror = () => reject(new Error("The PDF writer could not be loaded."));
      document.head.append(script);
    });
  }
  return pdfLibPromise;
}

export async function readPdfjs(file) {
  const pdfjs = await loadPdfjs();
  const bytes = new Uint8Array(await file.arrayBuffer());
  return pdfjs.getDocument({ data: bytes, isEvalSupported: false }).promise;
}

export async function readPdfLib(file) {
  const { PDFDocument } = await loadPdfLib();
  return PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
}

/** "1-3, 7, 10-" against a page count, returning zero based indexes. */
export function parsePageRange(text, count) {
  const clean = String(text || "").trim();
  if (!clean) return Array.from({ length: count }, (_, i) => i);
  const pages = new Set();
  for (const part of clean.split(",")) {
    const piece = part.trim();
    if (!piece) continue;
    const match = /^(\d+)?\s*(?:-\s*(\d+)?)?$/.exec(piece);
    if (!match) throw new Error(`"${piece}" is not a page or a range.`);
    const from = match[1] ? Number(match[1]) : 1;
    const to = match[2] ? Number(match[2]) : match[1] ? from : count;
    if (from < 1 || to < 1) throw new Error("Pages start at 1.");
    if (from > count || to > count) throw new Error(`This file has ${count} page${count === 1 ? "" : "s"}.`);
    if (from > to) throw new Error(`"${piece}" runs backwards.`);
    for (let page = from; page <= to; page++) pages.add(page - 1);
  }
  if (!pages.size) throw new Error("That range selects no pages.");
  return [...pages].sort((a, b) => a - b);
}
