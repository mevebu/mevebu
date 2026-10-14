// QR Scanner — camera via getUserMedia + jsQR (lazy-loaded), image upload fallback
import { el, icon, toast, copyText } from "../../lib/dom.js";

let jsQRPromise = null;
const loadJsQR = () => {
  if (!jsQRPromise) {
    jsQRPromise = import("jsqr").then((m) => m.default ?? m.jsQR);
  }
  return jsQRPromise;
};

export function mount(container) {
  const video = el("video", { class: "qrcam", playsinline: true, muted: true });
  const drop = el("div", { class: "dropzone" }, icon("image-up", "icon-lg"), el("p", {}, "…or drop / choose an image"));
  const fileIn = el("input", { type: "file", accept: "image/*", hidden: true });
  const result = el("pre", { class: "tout tout--block wrap" }, "");
  const status = el("div", { class: "tnote" }, "Camera off.");
  let stream = null, raf = 0, running = false;
  const scanCanvas = document.createElement("canvas");
  const sctx = scanCanvas.getContext("2d", { willReadFrequently: true });

  const startBtn = el("button", { class: "btn btn--accent", type: "button" }, icon("camera"), "Start camera");
  const stopBtn = el("button", { class: "btn btn--ghost", type: "button" }, icon("video-off"), "Stop");
  stopBtn.hidden = true;
  const pickBtn = el("button", { class: "btn btn--ghost", type: "button" }, icon("upload"), "Upload image");

  function showResult(text) {
    result.textContent = text;
    toast("QR decoded ✓");
  }

  async function startCam() {
    if (!navigator.mediaDevices?.getUserMedia) { status.textContent = "⚠ Camera not available here (needs HTTPS). Use image upload."; return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      video.srcObject = stream;
      await video.play();
      running = true;
      startBtn.hidden = true; stopBtn.hidden = false;
      status.textContent = "Scanning… point at a QR code.";
      const jsQR = await loadJsQR();
      tick(jsQR);
    } catch (e) {
      status.textContent = "⚠ Camera permission denied. You can still upload an image.";
    }
  }

  function tick(jsQR) {
    if (!running) return;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const w = (scanCanvas.width = video.videoWidth);
      const h = (scanCanvas.height = video.videoHeight);
      sctx.drawImage(video, 0, 0, w, h);
      const img = sctx.getImageData(0, 0, w, h);
      const code = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" });
      if (code && code.data) { showResult(code.data); stopCam(); return; }
    }
    raf = requestAnimationFrame(() => tick(jsQR));
  }

  function stopCam() {
    running = false;
    cancelAnimationFrame(raf);
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    startBtn.hidden = false; stopBtn.hidden = true;
    status.textContent = "Camera off.";
  }

  async function scanFile(file) {
    const jsQR = await loadJsQR();
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = (scanCanvas.width = img.naturalWidth);
      const h = (scanCanvas.height = img.naturalHeight);
      sctx.drawImage(img, 0, 0, w, h);
      const code = jsQR(sctx.getImageData(0, 0, w, h).data, w, h);
      if (code?.data) showResult(code.data);
      else status.textContent = "⚠ No QR code found in that image.";
      URL.revokeObjectURL(url);
    };
    img.onerror = () => status.textContent = "⚠ Could not read that image.";
    img.src = url;
  }

  startBtn.onclick = startCam;
  stopBtn.onclick = stopCam;
  pickBtn.onclick = () => fileIn.click();
  fileIn.onchange = () => fileIn.files[0] && scanFile(fileIn.files[0]);
  drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("is-drag"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("is-drag"));
  drop.addEventListener("drop", (e) => {
    e.preventDefault(); drop.classList.remove("is-drag");
    const f = e.dataTransfer.files[0];
    if (f) scanFile(f);
  });

  const actions = el("div", { class: "trow" });
  const copyB = el("button", { class: "btn btn--ghost", type: "button" }, icon("copy"), "Copy");
  const openB = el("a", { class: "btn btn--ghost", target: "_blank", rel: "noopener" }, icon("external-link"), "Open link");
  copyB.onclick = async () => result.textContent && ((await copyText(result.textContent)) && toast("Copied ✓"));
  actions.append(copyB, openB);

  container.append(el("div", { class: "tstack" },
    el("div", { class: "trow" }, startBtn, stopBtn, pickBtn),
    video, drop, fileIn, status,
    el("label", { class: "tfield" }, el("span", { class: "tfield__label" }, "Decoded content"), result),
    actions));

  return { unmount: stopCam };
}
export default { mount };
