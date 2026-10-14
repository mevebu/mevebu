// Spins through your options and lands on one. Canvas wheel with an eased
// spin, driven by the browser random source, so every option has equal odds.
import { el, toast, randomInt, bench, stage, stack, panel, textArea, button, output, readPin, writePin, toolcard, actions } from "../core.js";

const SEGMENTS = ["#2456D6", "#151D2E", "#5F8BFF", "#4B5871", "#1A43AD", "#69748C", "#1D2A4D", "#C2CBDF"];

function entriesFrom(text) {
  return text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
}

export function mount(slot) {
  const PIN = "spin-wheel";
  const saved = readPin(PIN, { entries: "Ana\nBudi\nCitra\nDimas\nElena\nFajar" });

  const listField = textArea({ value: saved.entries ?? "", "aria-label": "Options, one per line", placeholder: "One option per line" });
  const canvas = el("canvas", { class: "mvb-wheel", width: 360, height: 360, role: "img", "aria-label": "The wheel" });
  const context = canvas.getContext("2d");
  const result = output({ rows: 2 });
  const historyBox = el("div", { class: "mvb-wheel__history", role: "list" });

  const spinButton = button("Spin", { icon: "rotate-cw", kind: "fill" });
  const clearButton = button("Clear past picks", { icon: "trash", kind: "quiet" });

  const status = el("div", { class: "mvb-wheel__status", "aria-live": "polite" }, "Add options, then spin.");
  result.write("");

  let rotation = 0;
  let busy = false;
  let frame = 0;

  function draw() {
    const entries = entriesFrom(listField.value);
    const size = 360;
    const center = size / 2;
    const radius = center - 12;
    const root = getComputedStyle(document.documentElement);
    const ground = root.getPropertyValue("--mvb-void").trim() || "#fff";
    const orbit = root.getPropertyValue("--mvb-orbit-hard").trim() || "#888";
    const faint = root.getPropertyValue("--mvb-ink-3").trim() || "#888";
    const comet = root.getPropertyValue("--mvb-comet").trim() || "#2456D6";

    context.clearRect(0, 0, size, size);
    if (entries.length < 2) {
      context.fillStyle = faint;
      context.font = "15px system-ui";
      context.textAlign = "center";
      context.fillText(entries.length ? "Add one more option to spin" : "Type options on the left", center, center);
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
      context.fillStyle = "#fff";
      context.font = "600 13px system-ui, sans-serif";
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
    context.fillStyle = comet;
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
    const winner = randomInt(entries.length);
    const finish = (-Math.PI / 2) - (winner * slice + slice / 2);
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
        status.textContent = entries[winner];
        result.write(entries[winner]);
        const chip = el("span", { class: "mvb-wheel__chip", role: "listitem" }, entries[winner]);
        historyBox.prepend(chip);
        while (historyBox.children.length > 12) historyBox.lastChild.remove();
      }
    };
    frame = requestAnimationFrame(step);
  }

  listField.addEventListener("input", () => {
    status.dataset.winner = "";
    writePin(PIN, { entries: listField.value });
    draw();
  });
  spinButton.addEventListener("click", spin);
  clearButton.addEventListener("click", () => {
    historyBox.replaceChildren();
    result.write("");
    status.dataset.winner = "";
    status.textContent = "Past picks cleared.";
  });

  const card = toolcard({
    body: bench(
      stack(panel("Options, one per line", listField)),
      stage(canvas, status, result, historyBox)
    ),
    foot: actions(clearButton, spinButton),
  });
  slot.append(card.node);
  draw();

  return {
    unmount() {
      cancelAnimationFrame(frame);
      busy = false;
    },
  };
}

export default { mount };