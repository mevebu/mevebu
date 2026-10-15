// Reference for the common MIME types, filterable by extension or type.
import { el, bench, stack, panel, textInput, copyButton, actions, toolcard } from "../core.js";

const TYPES = [
  ["html", "text/html", "Text"], ["htm", "text/html", "Text"], ["css", "text/css", "Text"], ["js", "text/javascript", "Text"], ["mjs", "text/javascript", "Text"], ["json", "application/json", "Data"], ["xml", "application/xml", "Data"], ["txt", "text/plain", "Text"], ["csv", "text/csv", "Data"], ["md", "text/markdown", "Text"], ["yaml", "application/yaml", "Data"], ["yml", "application/yaml", "Data"], ["webmanifest", "application/manifest+json", "Data"],
  ["pdf", "application/pdf", "Document"], ["rtf", "application/rtf", "Document"], ["doc", "application/msword", "Document"], ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Document"], ["xls", "application/vnd.ms-excel", "Document"], ["xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Document"], ["ppt", "application/vnd.ms-powerpoint", "Document"], ["pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "Document"], ["epub", "application/epub+zip", "Document"],
  ["zip", "application/zip", "Archive"], ["gz", "application/gzip", "Archive"], ["tar", "application/x-tar", "Archive"], ["rar", "application/vnd.rar", "Archive"], ["7z", "application/x-7z-compressed", "Archive"], ["jar", "application/java-archive", "Archive"], ["apk", "application/vnd.android.package-archive", "Archive"],
  ["png", "image/png", "Image"], ["jpg", "image/jpeg", "Image"], ["jpeg", "image/jpeg", "Image"], ["gif", "image/gif", "Image"], ["webp", "image/webp", "Image"], ["svg", "image/svg+xml", "Image"], ["ico", "image/x-icon", "Image"], ["avif", "image/avif", "Image"], ["bmp", "image/bmp", "Image"], ["tiff", "image/tiff", "Image"],
  ["mp3", "audio/mpeg", "Audio"], ["wav", "audio/wav", "Audio"], ["ogg", "audio/ogg", "Audio"], ["oga", "audio/ogg", "Audio"], ["m4a", "audio/mp4", "Audio"], ["flac", "audio/flac", "Audio"], ["aac", "audio/aac", "Audio"],
  ["mp4", "video/mp4", "Video"], ["webm", "video/webm", "Video"], ["ogv", "video/ogg", "Video"], ["mov", "video/quicktime", "Video"], ["avi", "video/x-msvideo", "Video"], ["mkv", "video/x-matroska", "Video"],
  ["woff", "font/woff", "Font"], ["woff2", "font/woff2", "Font"], ["ttf", "font/ttf", "Font"], ["otf", "font/otf", "Font"], ["eot", "application/vnd.ms-fontobject", "Font"],
  ["wasm", "application/wasm", "Binary"], ["bin", "application/octet-stream", "Binary"]];

export function mount(slot) {
  const filter = textInput({ type: "search", placeholder: "Extension or type", "aria-label": "Filter" });
  const scroll = el("div", { class: "max-h-80 overflow-auto" });
  let visible = TYPES;

  function run() {
    const query = filter.value.trim().toLowerCase();
    visible = TYPES.filter(([ext, mime]) => !query || ext.includes(query) || mime.toLowerCase().includes(query));
    if (!visible.length) {
      scroll.replaceChildren(el("p", { class: "border-s-[3px] border-transparent ps-2 text-sm text-ink-3" }, "No type matches."));
      return;
    }
    scroll.replaceChildren(el(
      "table",
      { class: "w-full border-collapse font-mono text-sm [&_th]:wrap-anywhere [&_td]:wrap-anywhere [&_th]:border-b [&_td]:border-b [&_th]:border-orbit [&_td]:border-orbit [&_th]:px-2.5 [&_td]:px-2.5 [&_th]:py-2 [&_td]:py-2 [&_th]:text-start [&_td]:text-start [&_th]:font-sans [&_th]:text-2xs [&_th]:font-semibold [&_th]:text-ink-2 [&_tbody>tr:last-child>th]:border-b-0 [&_tbody>tr:last-child>td]:border-b-0" },
      el("thead", {}, el("tr", {}, el("th", {}, "Extension"), el("th", {}, "MIME type"), el("th", {}, "Kind"))),
      el("tbody", {}, ...visible.map(([ext, mime, kind]) => el("tr", {},
        el("td", {}, `.${ext}`),
        el("td", {}, mime),
        el("td", {}, kind)
      )))
    ));
  }

  filter.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Filter", filter)),
      stack(panel("MIME types", scroll))
    ),
    foot: actions(copyButton(() => visible.map(([ext, mime]) => `.${ext} ${mime}`).join("\n"), "Copy list", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
