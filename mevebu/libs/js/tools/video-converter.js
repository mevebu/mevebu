// Video to WebM, or just its audio. The file plays into a canvas and the canvas
// is recorded, so the conversion runs at real time and needs no WebAssembly
// encoder. A thirty second clip takes about thirty seconds.
import {
  el, toast, download, bench, stack, panel, selectInput, rangeInput, button,
  actions, toolcard, blank, notice, checkbox,
} from "../core.js";
import { dropzone, baseName, formatBytes } from "../files.js";

const HEIGHTS = [
  { value: "keep", label: "Keep" },
  { value: "1080", label: "1080p" },
  { value: "720", label: "720p" },
  { value: "480", label: "480p" },
];

function pickMime(preferred) {
  const candidates = preferred === "audio"
    ? ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"]
    : ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

export function mount(slot) {
  let file = null;
  let url = "";
  let video = null;
  let recorder = null;
  let stream = null;
  let audioContext = null;
  let frame = 0;
  let cancelled = false;
  let busy = false;
  let token = 0;

  const output = selectInput(
    [
      { value: "video", label: "WebM video" },
      { value: "audio", label: "Audio only (Opus)" },
    ],
    { value: "video", "aria-label": "Output" }
  );
  const height = selectInput(HEIGHTS, { value: "720", "aria-label": "Resolution" });
  const bitrate = rangeInput({ min: "1", max: "10", step: "0.5", value: "4", "aria-label": "Bitrate" });
  const bitrateLabel = el("span", { class: "text-sm font-semibold text-ink-2 tabular-nums" }, "4 Mbps");
  const bitratePanel = el("div", { class: "grid gap-1.5" },
    el("span", { class: "text-sm font-semibold text-ink-2" }, "Bitrate"),
    bitrate,
    bitrateLabel);
  const keepAudio = checkbox("Include audio", { checked: true });

  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const progress = el("div", { class: "h-2 overflow-hidden rounded-full bg-deck-2" },
    el("div", { class: "h-full w-0 rounded-full bg-jade transition-[width] duration-150" }));
  const stage = el("div", { class: "grid place-items-center overflow-hidden rounded-r2 border border-orbit bg-deck-2 p-3" });
  const empty = blank("video", "Open a video to convert it.");
  const progressBox = el("div", { class: "grid gap-1.5" }, progress);

  const drop = dropzone({ label: "Drop a video here", accept: "video/*", iconName: "video" });
  const clearButton = button("Clear", { icon: "trash", kind: "quiet" });
  const cancelButton = button("Cancel", { icon: "x", kind: "quiet" });
  const convertButton = button("Convert", { icon: "download", kind: "fill" });

  function sync() {
    bitrateLabel.textContent = `${Number(bitrate.value).toFixed(1).replace(/\.0$/, "")} Mbps`;
    const audioOnly = output.value === "audio";
    height.disabled = audioOnly;
    keepAudio.hidden = audioOnly;
    bitratePanel.hidden = audioOnly;
  }

  function reset() {
    cancelled = true;
    token++;
    cancelAnimationFrame(frame);
    if (recorder && recorder.state !== "inactive") recorder.stop();
    recorder = null;
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    audioContext?.close().catch(() => {});
    audioContext = null;
    if (url) URL.revokeObjectURL(url);
    url = "";
    file = null;
    video = null;
    stage.replaceChildren();
    stage.hidden = true;
    progress.firstElementChild.style.width = "0%";
    progressBox.hidden = true;
    summary.textContent = "";
    error.write("");
    empty.hidden = false;
    convertButton.disabled = true;
    cancelButton.hidden = true;
    clearButton.disabled = true;
  }

  async function open(files) {
    const picked = Array.from(files).find((entry) => entry.type.startsWith("video/") || /\.(mp4|webm|mov|m4v|ogv|mkv)$/i.test(entry.name));
    if (!picked) {
      error.write("That file is not a video.");
      return;
    }
    reset();
    const current = ++token;
    summary.textContent = "Reading the video";
    url = URL.createObjectURL(picked);
    const element = el("video", {
      src: url,
      class: "max-h-[320px] w-auto max-w-full rounded-r1 border border-orbit",
      playsinline: "",
      preload: "metadata",
    });
    try {
      await new Promise((resolve, reject) => {
        element.onloadedmetadata = resolve;
        element.onerror = () => reject(new Error("This video could not be read by the browser."));
      });
      if (current !== token) return;
      file = picked;
      video = element;
      stage.replaceChildren(element);
      stage.hidden = false;
      empty.hidden = true;
      convertButton.disabled = false;
      clearButton.disabled = false;
      error.write("");
      const ratio = element.videoWidth && element.videoHeight ? `${element.videoWidth} x ${element.videoHeight}` : "unknown size";
      summary.textContent = `${picked.name} · ${ratio} · ${element.duration.toFixed(1)} s · ${formatBytes(picked.size)}`;
      if (!element.captureStream && !element.mozCaptureStream) {
        error.write("This browser cannot capture a video element, so conversion is unavailable here.");
      }
    } catch (caught) {
      if (current !== token) return;
      summary.textContent = "";
      error.write(caught?.message || "This video could not be read.");
    }
  }

  function targetSize(sourceWidth, sourceHeight) {
    const wanted = height.value === "keep" ? sourceHeight : Number(height.value);
    const scale = Math.min(1, wanted / sourceHeight);
    const even = (value) => Math.max(2, Math.round(value / 2) * 2);
    return { width: even(sourceWidth * scale), height: even(sourceHeight * scale) };
  }

  async function convert() {
    if (!video || busy) return;
    const mime = pickMime(output.value);
    if (!mime) {
      error.write("This browser has no MediaRecorder support for WebM.");
      return;
    }
    busy = true;
    cancelled = false;
    const current = ++token;
    convertButton.disabled = true;
    clearButton.disabled = true;
    cancelButton.hidden = false;
    progressBox.hidden = false;
    error.write("");
    summary.textContent = output.value === "audio" ? "Recording audio" : "Recording video";

    try {
      const tracks = [];
      let canvas = null;

      if (output.value === "video") {
        const { width, height: targetHeight } = targetSize(video.videoWidth || 1280, video.videoHeight || 720);
        canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = targetHeight;
        const context = canvas.getContext("2d", { alpha: false });
        const draw = () => {
          if (cancelled) return;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          frame = requestAnimationFrame(draw);
        };
        draw();
        stream = canvas.captureStream(30);
        tracks.push(...stream.getVideoTracks());
      }

      if (keepAudio.input.checked || output.value === "audio") {
        audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(video);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioContext.destination);
        tracks.push(...destination.stream.getAudioTracks());
      }

      const combined = new MediaStream(tracks);
      const kbps = Math.round(Number(bitrate.value) * 1000 * 1000);
      recorder = new MediaRecorder(combined, {
        mimeType: mime,
        videoBitsPerSecond: output.value === "video" ? kbps : undefined,
        audioBitsPerSecond: 128000,
      });
      const chunks = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      const done = new Promise((resolve) => {
        recorder.onstop = resolve;
      });

      video.currentTime = 0;
      video.muted = false;
      await video.play();
      recorder.start(250);

      await new Promise((resolve) => {
        const tick = () => {
          if (cancelled) return resolve();
          const ratio = video.duration ? Math.min(1, video.currentTime / video.duration) : 0;
          progress.firstElementChild.style.width = `${Math.round(ratio * 100)}%`;
          summary.textContent = `${output.value === "audio" ? "Recording audio" : "Recording video"} · ${video.currentTime.toFixed(1)} / ${video.duration.toFixed(1)} s`;
          if (video.ended || video.paused) return resolve();
          frame = requestAnimationFrame(tick);
        };
        video.onended = resolve;
        tick();
      });

      cancelAnimationFrame(frame);
      video.pause();
      if (recorder.state !== "inactive") recorder.stop();
      await done;
      if (current !== token) return;

      const blob = new Blob(chunks, { type: mime.split(";")[0] });
      if (!blob.size) throw new Error("The recorder produced no data.");
      const ext = output.value === "audio" ? "opus.webm" : "webm";
      download(`${baseName(file.name)}.${ext}`, blob);
      progress.firstElementChild.style.width = "100%";
      summary.textContent = `${formatBytes(blob.size)} · ${output.value === "audio" ? "audio" : `${canvas.width} x ${canvas.height}`}`;
      toast("WebM ready");
    } catch (caught) {
      summary.textContent = "";
      error.write(caught?.message || "Could not convert this video.");
    } finally {
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
      audioContext?.close().catch(() => {});
      audioContext = null;
      if (current === token) {
        busy = false;
        convertButton.disabled = false;
        clearButton.disabled = false;
        cancelButton.hidden = true;
      }
    }
  }

  function cancel() {
    cancelled = true;
    token++;
    cancelAnimationFrame(frame);
    if (recorder && recorder.state !== "inactive") recorder.stop();
    if (video) video.pause();
    summary.textContent = "Cancelled";
    progressBox.hidden = true;
    cancelButton.hidden = true;
    convertButton.disabled = false;
    clearButton.disabled = false;
    busy = false;
  }

  drop.onFiles(open);
  output.addEventListener("change", sync);
  bitrate.addEventListener("input", sync);
  convertButton.addEventListener("click", convert);
  cancelButton.addEventListener("click", cancel);
  clearButton.addEventListener("click", reset);
  sync();
  reset();

  const shell = toolcard({
    body: bench(
      stack(
        drop,
        panel("Output", output),
        panel("Resolution", height),
        bitratePanel,
        keepAudio,
        error,
        el("p", { class: "m-0 text-2xs leading-[1.6] text-ink-3" },
          "Recording happens at real time: a two minute clip takes about two minutes. Keep the tab in front while it runs.")
      ),
      stack(summary, empty, stage, progressBox)
    ),
    foot: actions(clearButton, cancelButton, convertButton),
  });

  slot.append(shell.node);

  return {
    unmount() {
      cancelled = true;
      token++;
      cancelAnimationFrame(frame);
      if (recorder && recorder.state !== "inactive") recorder.stop();
      stream?.getTracks().forEach((track) => track.stop());
      audioContext?.close().catch(() => {});
      if (url) URL.revokeObjectURL(url);
    },
  };
}

export default { mount };
