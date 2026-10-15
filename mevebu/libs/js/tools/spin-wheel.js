// Spins through your options and lands on one. Canvas wheel with an eased
// spin, driven by the browser random source, so every option has equal odds.
import { el, toast, copyButton, randomInt, bench, stage, stack, panel, textArea, button, readPin, writePin, toolcard, actions } from "../core.js";

// The slice palette. A green ramp that alternates dark and light, so two
// neighbouring slices never read as one wedge and every label stays legible.
const SEGMENTS = ["#0f6b4a", "#e0f0e7", "#0a5138", "#bfcac1", "#35805f", "#1d3b2c", "#8fd0b3", "#0b2a1e"];

/**
 * The slice label, in whichever ink reads better on that fill. Every fill in the
 * palette sits far enough from mid grey that one of the two clears 4.5:1, so a
 * pale slice never gets white text.
 */
function textOn(hex) {
  const linear = (value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = [1, 3, 5].map((at) => linear(parseInt(hex.slice(at, at + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.2056 ? "#101a15" : "#FFFFFF";
}

function entriesFrom(text) {
  return text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
}

export function mount(slot) {
  const PIN = "spin-wheel";
  const saved = readPin(PIN, { entries: "Ana\nBudi\nCitra\nDimas\nElena\nFajar" });

  const listField = textArea({ value: saved.entries ?? "", "aria-label": "Options, one per line", placeholder: "One option per line" });
  const canvas = el("canvas", { class: "h-auto w-[min(320px,100%)]", width: 360, height: 360, role: "img", "aria-label": "The wheel" });
  const context = canvas.getContext("2d");
  const historyBox = el("div", { class: "flex max-w-[340px] flex-wrap justify-center gap-1.5", role: "list" });

  const spinButton = button("Spin", { icon: "rotate-cw", kind: "fill" });
  const clearButton = button("Clear past picks", { icon: "trash", kind: "quiet" });
  const copyWinner = copyButton(() => winner, "Copy winner");

  const status = el("div", { class: "text-balance text-xl font-bold tracking-[-0.01em]", "aria-live": "polite" }, "Add options, then spin.");

  let rotation = 0;
  let busy = false;
  let frame = 0;
  let winner = "";

  function draw() {
    const entries = entriesFrom(listField.value);
    const size = 360;
    const center = size / 2;
    const radius = center - 12;
    const root = getComputedStyle(document.documentElement);
    const ground = root.getPropertyValue("--void").trim() || "#fff";
    const orbit = root.getPropertyValue("--orbit-hard").trim() || "#888";
    const faint = root.getPropertyValue("--ink-3").trim() || "#888";
    const jade = root.getPropertyValue("--jade").trim() || "#0f6b4a";
    // Canvas text is outside the stylesheet, so it reads the same stack the page uses.
    const stack = root.getPropertyValue("--sans").trim() || "system-ui, sans-serif";

    context.clearRect(0, 0, size, size);
    if (entries.length < 2) {
      context.fillStyle = faint;
      context.font = `15px ${stack}`;
      context.textAlign = "center";
      context.fillText(entries.length ? "Add one more option to spin" : "Type options to spin", center, center);
      status.textContent = entries.length ? "One more option to go." : "Add options, then spin.";
      return;
    }
    const slice = (Math.PI * 2) / entries.length;
    entries.forEach((entry, i) => {
      const a0 = rotation + i * slice;
      context.beginPath();
      context.moveTo(center, center);
      context.arc(center, center, radius, a0, a0 + slice);
      context.closePath();
      context.fillStyle = SEGMENTS[i % SEGMENTS.length];
      context.fill();
      context.save();
      context.translate(center, center);
      context.rotate(a0 + slice / 2);
      context.textAlign = "right";
      context.fillStyle = textOn(SEGMENTS[i % SEGMENTS.length]);
      context.font = `600 13px ${stack}`;
      const label = entry.length > 13 ? `${entry.slice(0, 12)}…` : entry;
      context.fillText(label, radius - 12, 4);
      context.restore();
    });
    context.beginPath();
    context.arc(center, center, 16, 0, Math.PI * 2);
    context.fillStyle = ground;
    context.fill();
    context.strokeStyle = orbit;
    context.stroke();

    context.beginPath();
    context.moveTo(center - 8, 2);
    context.lineTo(center + 8, 2);
    context.lineTo(center, 20);
    context.closePath();
    context.fillStyle = jade;
    context.fill();
    if (status.dataset.winner !== "1") status.textContent = "Add options, then spin.";
  }

  function spin() {
    const entries = entriesFrom(listField.value);
    if (entries.length < 2) return toast(entries.length ? "Add one more option to spin" : "Add options first");
    if (busy) return;
    busy = true;
    spinButton.disabled = true;
    status.dataset.winner = "";
    const slice = (Math.PI * 2) / entries.length;
    const winnerIndex = randomInt(entries.length);
    const finish = (-Math.PI / 2) - (winnerIndex * slice + slice / 2);
    const fullTurns = Math.PI * 2 * (5 + randomInt(3));
    const delta = ((finish - rotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) + fullTurns;
    const start = rotation;
    const duration = 2800 + randomInt(800);
    const t0 = performance.now();

    const step = (now) => {
      const progress = Math.min(1, (now - t0) / duration);
      rotation = start + delta * (1 - Math.pow(1 - progress, 4));
      draw();
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      } else {
        busy = false;
        spinButton.disabled = false;
        status.dataset.winner = "1";
        winner = entries[winnerIndex];
        status.textContent = winner;
        const chip = el("span", { class: "rounded-full border border-orbit bg-deck-2 px-2.5 py-1 text-2xs font-semibold", role: "listitem" }, winner);
        historyBox.prepend(chip);
        while (historyBox.children.length > 12) historyBox.lastChild.remove();
      }
    };
    frame = requestAnimationFrame(step);
  }

  listField.addEventListener("input", () => {
    status.dataset.winner = "";
    winner = "";
    writePin(PIN, { entries: listField.value });
    draw();
  });
  spinButton.addEventListener("click", spin);
  clearButton.addEventListener("click", () => {
    historyBox.replaceChildren();
    winner = "";
    status.dataset.winner = "";
    status.textContent = "Past picks cleared.";
  });

  const card = toolcard({
    body: bench(
      stack(panel("Options, one per line", listField)),
      stage(canvas, status, historyBox)
    ),
    foot: actions(copyWinner, clearButton, spinButton)});
  slot.append(card.node);
  draw();

  return {
    unmount() {
      cancelAnimationFrame(frame);
      busy = false;
    }};
}

export default { mount };