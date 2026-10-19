# Rundown: 10 converter tools

Ten new tools for the **Convert** category. Every one runs on this device: no upload, no server, no
account. Two libraries are vendored so the whole set works offline:

| Library | Version | Used by | Size |
| --- | --- | --- | --- |
| `pdf-lib` | 1.17.1 | writing, merging, splitting and rearranging PDF files | 513 KB |
| `pdf.js` | 4.10.38 | reading a PDF: rendering pages and pulling text out | 344 KB + 1.3 MB worker |
| `mathjs` | 15.2.0 | the scientific calculator (already shipped in 1.10.0) | 635 KB |

They load only on the tool that needs them, so the other tools never download a parser.

---

## 1. Image to PDF

Drop one image or a whole set, drag them into order, and get one PDF.

- Page size: A4, Letter, or fit to the image.
- Orientation: portrait, landscape, or auto per page.
- Margin: none, small, or normal.
- Fit: contain (whole image visible) or cover (fill the page, crop the rest).

The image is redrawn on a canvas and embedded as JPEG, so a 40 MB phone photo becomes a normal
sized page instead of a 40 MB PDF.

## 2. PDF to Image

Open a PDF and get one PNG or JPEG per page.

- Page range (`1-3, 7, 10-`), scale (1x to 3x), format and JPEG quality.
- Every page renders in the browser through pdf.js, then the set downloads as a ZIP.
- A page preview shows what the first page will look like before the ZIP is built.

This is the reverse of tool 1, and the pair covers the "PDF to JPG" and "JPG to PDF" jobs without a
server.

## 3. PDF Merge

Combine several PDFs into one file.

- Add files in any order, drag to reorder, remove one.
- Each file shows its page count, so a wrong file is visible before the merge.
- The result keeps every page as it was; nothing is re-rendered, so text stays selectable.

## 4. PDF Split

Cut one PDF into several files.

- Split by page ranges (`1-4, 5-8`), by a fixed size (every 2 pages), or one file per page.
- Each part is named after the source and its range (`report-1-4.pdf`).
- The parts download as a ZIP, or one at a time.

## 5. PDF to Text

Pull the text out of a PDF.

- Choose all pages or a range.
- Each page is labelled (`--- page 3 ---`), so the order survives the copy.
- Copy everything, or download a `.txt`.
- A scanned PDF has no text layer; the tool says so instead of returning an empty file.

## 6. PDF Page Organizer

Reorder, rotate and delete pages without leaving the tab.

- Every page is a thumbnail in a grid.
- Rotate one page 90 degrees clockwise, or all of them at once.
- Drag a thumbnail to move it, or use the arrow buttons for keyboard control.
- Delete a page, then save. The rest keeps its order.

This is the "I scanned it sideways and the cover is at the end" fix.

## 7. Text to PDF

Paste text and get a clean PDF.

- Page size, margin, font size and line height.
- Wraps long lines, breaks pages at the margin, and keeps blank lines as spacing.
- Optional page numbers and a title in the header.
- The text is embedded with a standard font, so the PDF opens anywhere and the text stays
  selectable.

## 8. SVG to PNG

Turn an SVG file into a PNG at any size.

- Width and height in pixels, or a scale multiplier (1x to 8x).
- Background: transparent, white, or a picked colour.
- The SVG is drawn at the requested size, so the result is sharp instead of an upscaled bitmap.

Useful when a logo has to become an app icon or a social preview image.

## 9. Audio Converter

Convert an audio file to WAV, and change its shape while doing it.

- Input: anything the browser can decode (WAV, MP3, OGG, FLAC, M4A, AAC, WebM audio).
- Output: WAV, 16-bit PCM.
- Sample rate: 22.05, 44.1 or 48 kHz. Channels: mono or stereo.
- Optional normalize, and a trim by start and end time.

Decoding and encoding both happen in the tab through the Web Audio API.

## 10. Video Converter

Convert a video file to WebM, or pull its audio track out.

- Input: anything the browser can play (MP4, WebM, MOV, M4V).
- Output: WebM video (VP8/VP9 + Opus), or audio only (Opus in WebM).
- Resolution: keep, 1080p, 720p, 480p. Bitrate: a quality slider.
- A progress bar with the elapsed and total time, and a cancel button.

The conversion plays the file into a canvas and records it, so it runs at real time and needs no
1 MB WebAssembly build. A 30 second clip takes about 30 seconds.

---

## What changes in the app

- Ten registry entries in `convert`, each with a tutorial and keywords.
- `mevebu/libs/js/vendor/` gains `pdf-lib.min.js`, `pdf.min.mjs` and `pdf.worker.min.mjs`.
- A shared `pdf.js` loader, so the three reading tools configure the worker once.
- The README tool count and the Convert row move from 5 to 15.
