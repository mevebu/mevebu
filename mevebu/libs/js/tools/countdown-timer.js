// Counts down from a duration you set, then beeps and flags the tab title.
import { toast, bench, stack, row, panel, numberInput, chipRow, button, output, notice, actions, toolcard } from "../core.js";

const PRESETS = [
  { value: 5, label: "5 min" },
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 25, label: "25 min" },
];

function format(ms) {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function beep() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  try {
    const context = new Ctx();
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.4);
    osc.connect(gain).connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + 0.4);
    osc.onended = () => context.close();
  } catch {
    /* audio blocked, the title still changes */
  }
}

export function mount(slot) {
  const baseTitle = document.title;

  const hoursIn = numberInput({ min: 0, max: 99, value: 0, "aria-label": "Hours" });
  const minsIn = numberInput({ min: 0, max: 59, value: 25, "aria-label": "Minutes" });
  const secsIn = numberInput({ min: 0, max: 59, value: 0, "aria-label": "Seconds" });

  const presets = chipRow(PRESETS, {
    value: 25,
    label: "Presets",
    onChange: (minutes) => {
      hoursIn.value = 0;
      minsIn.value = minutes;
      secsIn.value = 0;
      reset();
    },
  });

  const display = output({ rows: 2 });
  const status = notice("good");
  const startButton = button("Start", { icon: "play", kind: "fill" });
  const resetButton = button("Reset", { icon: "refresh-cw" });

  let interval = 0;
  let endAt = 0;
  let remaining = 25 * 60 * 1000;
  let mode = "idle";

  const label = () => startButton.querySelector("span");

  function readInputs() {
    const h = Math.max(0, Number(hoursIn.value) || 0);
    const m = Math.max(0, Number(minsIn.value) || 0);
    const s = Math.max(0, Number(secsIn.value) || 0);
    return ((h * 60 + m) * 60 + s) * 1000;
  }

  function paint() {
    display.write(format(remaining));
  }

  function setInputsDisabled(off) {
    hoursIn.disabled = off;
    minsIn.disabled = off;
    secsIn.disabled = off;
  }

  function stopTimer() {
    clearInterval(interval);
    interval = 0;
  }

  function tick() {
    remaining = Math.max(0, endAt - performance.now());
    paint();
    if (remaining <= 0) finish();
  }

  function finish() {
    stopTimer();
    mode = "idle";
    remaining = 0;
    paint();
    document.title = "Time is up";
    status.write("Time is up.");
    label().textContent = "Start";
    setInputsDisabled(false);
    beep();
  }

  function reset() {
    stopTimer();
    mode = "idle";
    remaining = readInputs();
    document.title = baseTitle;
    status.write("");
    label().textContent = "Start";
    setInputsDisabled(false);
    paint();
  }

  function start() {
    if (mode === "running") {
      remaining = Math.max(0, endAt - performance.now());
      stopTimer();
      mode = "paused";
      label().textContent = "Resume";
      return;
    }
    if (remaining <= 0) {
      remaining = readInputs();
      if (remaining <= 0) return toast("Set a duration first");
    }
    endAt = performance.now() + remaining;
    mode = "running";
    setInputsDisabled(true);
    status.write("");
    document.title = baseTitle;
    label().textContent = "Pause";
    interval = setInterval(tick, 200);
  }

  startButton.addEventListener("click", start);
  resetButton.addEventListener("click", reset);
  for (const input of [hoursIn, minsIn, secsIn]) {
    input.addEventListener("input", () => {
      if (mode === "idle") {
        remaining = readInputs();
        paint();
      }
    });
  }

  const card = toolcard({
    body: bench(
      stack(
        panel("Presets", presets),
        row(panel("Hours", hoursIn), panel("Minutes", minsIn), panel("Seconds", secsIn))
      ),
      stack(display, status)
    ),
    foot: actions(resetButton, startButton),
  });
  slot.append(card.node);
  paint();

  return {
    unmount() {
      stopTimer();
      document.title = baseTitle;
    },
  };
}

export default { mount };
