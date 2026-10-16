// Reads a QR code from the camera or from an image file. The decoder loads
// once and stays in memory. The camera stops when the page changes or a code
// is found. Nothing leaves the tab at any point.
import { el, icon, toast, bench, stack, panel, notice, button, copyButton, output, actions, toolcard } from "../core.js";

// jsQR ships as a UMD bundle, so it has to load as a classic script and be read
// off the window. Importing it as a module yields an empty namespace.
let loading = null;
function loadJsQR() {
  if (window.jsQR) return Promise.resolve(window.jsQR);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = el("script", { src: new URL("../vendor/jsQR.js", import.meta.url).href });
    script.onload = () => (window.jsQR ? resolve(window.jsQR) : reject(new Error("jsQR did not register")));
    script.onerror = () => reject(new Error("The QR decoder could not be loaded"));
    document.head.append(script);
  });
  return loading;
}

export function mount(slot) {
  const video = el("video", { class: "w-[min(420px,100%)] rounded-r2 border border-orbit-hard bg-black", playsinline: true, muted: true, hidden: true });
  const fileField = el("input", { type: "file", accept: "image/*", hidden: true, "aria-label": "Image file" });
  const status = el("p", { class: "border-s-[3px] border-transparent ps-2 text-sm text-ink-3" });
  const found = output({ rows: 3 });
  const error = notice("error");

  let stream = null;
  let frame = 0;
  let live = false;
  const scratch = document.createElement("canvas");
  const paint = scratch.getContext("2d", { willReadFrequently: true });

  const startButton = button("Start camera", { icon: "camera", kind: "fill" });
  const stopButton = button("Stop", { icon: "video-off" });
  stopButton.hidden = true;
  const uploadButton = button("Choose an image", { icon: "upload" });
  const openWrap = el("span", { class: "flex min-w-0 flex-wrap items-center gap-2" });

  const drop = el(
    "div",
    { class: "grid cursor-pointer justify-items-center gap-2 rounded-r2 border border-dashed border-orbit-hard px-4 py-7 text-sm text-ink-3 transition-colors duration-150 hover:border-jade hover:bg-jade-soft data-[drag]:border-jade data-[drag]:bg-jade-soft", role: "button", tabindex: "0", "aria-label": "Drop an image here or choose one" },
    icon("image-up", "size-[26px] flex-none"),
    el("p", {}, "Drop an image here, or choose one.")
  );

  function report(text) {
    found.write(text);
    status.textContent = "Found.";
    error.write("");
    openWrap.replaceChildren();
    if (/^https?:\/\//i.test(text.trim())) {
      openWrap.append(button("Open link", { tag: "a", href: text.trim(), target: "_blank", rel: "noopener", icon: "external-link" }));
    }
    toast("Found");
  }

  async function scan(width, height, read) {
    const decode = await loadJsQR();
    scratch.width = width;
    scratch.height = height;
    read();
    const pixels = paint.getImageData(0, 0, width, height);
    const code = decode(pixels.data, width, height, { inversionAttempts: "dontInvert" })
      ?? decode(pixels.data, width, height);
    if (code?.data) {
      report(code.data);
      return true;
    }
    return false;
  }

  async function tick() {
    if (!live) return;
    if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth) {
      let hit = false;
      try {
        hit = await scan(video.videoWidth, video.videoHeight, () =>
          paint.drawImage(video, 0, 0, video.videoWidth, video.videoHeight));
      } catch {
        stop();
        error.write("The decoder did not load. Try again, or read an image instead.");
        return;
      }
      if (hit) {
        stop();
        return;
      }
    }
    frame = requestAnimationFrame(tick);
  }

  async function start() {
    error.write("");
    if (!navigator.mediaDevices?.getUserMedia) {
      error.write("This browser has no camera here. Use an image instead.");
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      video.srcObject = stream;
      video.hidden = false;
      await video.play();
      live = true;
      startButton.hidden = true;
      stopButton.hidden = false;
      status.textContent = "Point the camera at a code.";
      await loadJsQR();
      tick();
    } catch {
      error.write("The camera was blocked. Use an image instead.");
    }
  }

  function stop() {
    live = false;
    cancelAnimationFrame(frame);
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    video.srcObject = null;
    startButton.hidden = false;
    stopButton.hidden = true;
    if (!found.textContent) status.textContent = "Camera off.";
  }

  function scanFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      error.write("That file is not an image.");
      return;
    }
    error.write("");
    status.textContent = "Reading the image.";
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = async () => {
      try {
        const hit = await scan(image.naturalWidth, image.naturalHeight, () =>
          paint.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight));
        if (!hit) error.write("No QR code in that image.");
      } catch {
        error.write("That image could not be read.");
      }
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      error.write("That image could not be read.");
      URL.revokeObjectURL(url);
    };
    image.src = url;
  }

  startButton.addEventListener("click", start);
  stopButton.addEventListener("click", stop);
  uploadButton.addEventListener("click", () => fileField.click());
  drop.addEventListener("click", () => fileField.click());
  drop.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileField.click();
    }
  });
  fileField.addEventListener("change", () => {
    if (fileField.files[0]) scanFile(fileField.files[0]);
    fileField.value = "";
  });
  drop.addEventListener("dragover", (event) => {
    event.preventDefault();
    drop.dataset.drag = "";
  });
  drop.addEventListener("dragleave", () => delete drop.dataset.drag);
  drop.addEventListener("drop", (event) => {
    event.preventDefault();
    delete drop.dataset.drag;
    if (event.dataTransfer.files[0]) scanFile(event.dataTransfer.files[0]);
  });
  status.textContent = "Camera off.";

  const card = toolcard({
    head: actions(stopButton, uploadButton, startButton),
    body: bench(
      stack(video, drop, fileField, status, error),
      panel("Decoded", found)
    ),
    foot: actions(openWrap, copyButton(() => found.textContent, "Copy"))});
  slot.append(card.node);

  return { unmount: stop };
}

export default { mount };