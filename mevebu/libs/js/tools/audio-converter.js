// Audio to WAV. The file is decoded with the Web Audio API, optionally
// resampled, normalized and trimmed, then written as 16 bit PCM by hand.
import {
  el, toast, download, bench, stack, panel, selectInput, numberInput, checkbox,
  button, actions, toolcard, blank, notice,
} from "../core.js";
import { dropzone, baseName, formatBytes } from "../files.js";

const RATES = [
  { value: "22050", label: "22.05 kHz" },
  { value: "44100", label: "44.1 kHz" },
  { value: "48000", label: "48 kHz" },
];

function encodeWav(channels, sampleRate) {
  const length = channels[0].length;
  const count = channels.length;
  const dataBytes = length * count * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const ascii = (offset, text) => {
    for (let i = 0; i < text.length; i++) bytes[offset + i] = text.charCodeAt(i);
  };

  ascii(0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, count, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * count * 2, true);
  view.setUint16(32, count * 2, true);
  view.setUint16(34, 16, true);
  ascii(36, "data");
  view.setUint32(40, dataBytes, true);

  let at = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < count; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      view.setInt16(at, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      at += 2;
    }
  }
  return new Blob([buffer], { type: "audio/wav" });
}

export function mount(slot) {
  let file = null;
  let buffer = null;
  let busy = false;
  let token = 0;

  const rate = selectInput(RATES, { value: "44100", "aria-label": "Sample rate" });
  const channels = selectInput(
    [
      { value: "keep", label: "Keep" },
      { value: "1", label: "Mono" },
      { value: "2", label: "Stereo" },
    ],
    { value: "keep", "aria-label": "Channels" }
  );
  const start = numberInput({ min: "0", step: "0.1", value: "0", "aria-label": "Start seconds" });
  const end = numberInput({ min: "0", step: "0.1", value: "0", "aria-label": "End seconds" });
  const normalize = checkbox("Normalize volume", { checked: false });

  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const wave = el("div", { class: "grid h-24 items-end gap-px rounded-r1 border border-orbit bg-deck-2 p-2 [grid-template-columns:repeat(96,minmax(0,1fr))]" });
  const empty = blank("activity", "Open an audio file to convert it.");

  const drop = dropzone({ label: "Drop audio here", accept: "audio/*", iconName: "activity" });
  const clearButton = button("Clear", { icon: "trash", kind: "quiet" });
  const convertButton = button("Convert to WAV", { icon: "download", kind: "fill" });

  function reset() {
    token++;
    file = null;
    buffer = null;
    wave.replaceChildren();
    wave.hidden = true;
    summary.textContent = "";
    error.write("");
    empty.hidden = false;
    convertButton.disabled = true;
    clearButton.disabled = true;
  }

  function drawWave() {
    const data = buffer.getChannelData(0);
    const bars = 96;
    const step = Math.max(1, Math.floor(data.length / bars));
    wave.replaceChildren(
      ...Array.from({ length: bars }, (_, index) => {
        let peak = 0;
        const from = index * step;
        for (let i = from; i < Math.min(from + step, data.length); i += 16) {
          const value = Math.abs(data[i]);
          if (value > peak) peak = value;
        }
        return el("span", {
          class: "block w-full rounded-[1px] bg-jade/70",
          style: `height:${Math.max(2, Math.round(peak * 100))}%`,
        });
      })
    );
    wave.hidden = false;
  }

  async function open(files) {
    const picked = Array.from(files).find((entry) => entry.type.startsWith("audio/") || /\.(wav|mp3|ogg|flac|m4a|aac|opus|webm)$/i.test(entry.name));
    if (!picked) {
      error.write("That file is not audio.");
      return;
    }
    reset();
    const current = ++token;
    summary.textContent = "Decoding";
    try {
      const context = new AudioContext();
      const decoded = await context.decodeAudioData(await picked.arrayBuffer());
      await context.close();
      if (current !== token) return;
      file = picked;
      buffer = decoded;
      end.value = decoded.duration.toFixed(2);
      summary.textContent = `${picked.name} · ${decoded.duration.toFixed(2)} s · ${decoded.sampleRate} Hz · ${decoded.numberOfChannels} ch · ${formatBytes(picked.size)}`;
      empty.hidden = true;
      convertButton.disabled = false;
      clearButton.disabled = false;
      error.write("");
      drawWave();
    } catch (caught) {
      if (current !== token) return;
      summary.textContent = "";
      error.write(caught?.message || "This audio file could not be decoded.");
    }
  }

  async function convert() {
    if (!buffer || busy) return;
    busy = true;
    const current = ++token;
    convertButton.disabled = true;
    summary.textContent = "Rendering";
    error.write("");
    try {
      const targetRate = Number(rate.value) || 44100;
      const from = Math.max(0, Math.min(buffer.duration, Number(start.value) || 0));
      const to = Math.max(from + 0.01, Math.min(buffer.duration, Number(end.value) || buffer.duration));
      const seconds = to - from;
      const targetChannels = channels.value === "keep" ? buffer.numberOfChannels : Number(channels.value);

      const offline = new OfflineAudioContext(targetChannels, Math.ceil(seconds * targetRate), targetRate);
      const source = offline.createBufferSource();
      source.buffer = buffer;
      source.connect(offline.destination);
      source.start(0, from, seconds);
      const rendered = await offline.startRendering();
      if (current !== token) return;

      const out = [];
      for (let channel = 0; channel < targetChannels; channel++) {
        const fromChannel = rendered.numberOfChannels === 1 ? 0 : Math.min(channel, rendered.numberOfChannels - 1);
        out.push(rendered.getChannelData(fromChannel).slice());
      }

      if (normalize.input.checked) {
        let peak = 0;
        for (const channel of out) for (let i = 0; i < channel.length; i++) peak = Math.max(peak, Math.abs(channel[i]));
        if (peak > 0) {
          const gain = 0.98 / peak;
          for (const channel of out) for (let i = 0; i < channel.length; i++) channel[i] *= gain;
        }
      }

      const blob = encodeWav(out, targetRate);
      download(`${baseName(file.name)}.wav`, blob);
      summary.textContent = `${seconds.toFixed(2)} s · ${targetRate} Hz · ${targetChannels === 1 ? "mono" : "stereo"} · ${formatBytes(blob.size)}`;
      toast("WAV ready");
    } catch (caught) {
      summary.textContent = "";
      error.write(caught?.message || "Could not render this audio.");
    } finally {
      if (current === token) {
        busy = false;
        convertButton.disabled = false;
      }
    }
  }

  drop.onFiles(open);
  convertButton.addEventListener("click", convert);
  clearButton.addEventListener("click", reset);
  reset();

  const shell = toolcard({
    body: bench(
      stack(
        drop,
        panel("Sample rate", rate),
        panel("Channels", channels),
        el("div", { class: "grid grid-cols-2 gap-3" },
          panel("Start (s)", start),
          panel("End (s)", end)),
        normalize,
        error
      ),
      stack(summary, empty, wave,
        el("p", { class: "m-0 text-2xs leading-[1.6] text-ink-3" },
          "Output is uncompressed WAV, 16 bit PCM. A three minute stereo song at 44.1 kHz lands near 30 MB, which is normal for the format."))
    ),
    foot: actions(clearButton, convertButton),
  });

  slot.append(shell.node);

  return {
    unmount() {
      token++;
    },
  };
}

export default { mount };
