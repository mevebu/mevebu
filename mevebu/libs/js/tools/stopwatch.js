// Times an activity and records laps with millisecond precision.
import { el, blank, bench, stack, panel, button, output, copyButton, actions, toolcard } from "../core.js";

function format(ms) {
  const total = Math.floor(ms);
  const h = Math.floor(total / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const cs = total % 1000;
  const pad = (n, size = 2) => String(n).padStart(size, "0");
  return h > 0
    ? `${h}:${pad(m)}:${pad(s)}.${pad(cs, 3)}`
    : `${pad(m)}:${pad(s)}.${pad(cs, 3)}`;
}

export function mount(slot) {
  const display = output({ rows: 2 });
  const listWrap = el("div", { class: "mvb-scroll" });

  const startButton = button("Start", { icon: "play", kind: "fill" });
  const lapButton = button("Lap", { icon: "plus" });
  const resetButton = button("Reset", { icon: "refresh-cw" });
  const copyLaps = copyButton(() => lapsText(), "Copy laps");

  let running = false;
  let startAt = 0;
  let elapsed = 0;
  let frame = 0;
  let laps = [];

  const label = () => startButton.querySelector("span");
  const current = () => elapsed + (running ? performance.now() - startAt : 0);

  function paint() {
    display.write(format(current()));
  }

  function loop() {
    paint();
    frame = requestAnimationFrame(loop);
  }

  function updateButtons() {
    lapButton.disabled = !running;
    resetButton.disabled = !running && elapsed === 0 && laps.length === 0;
    copyLaps.disabled = laps.length === 0;
  }

  function renderLaps() {
    if (!laps.length) {
      listWrap.replaceChildren(blank("list", "No laps yet."));
      return;
    }
    const rows = laps.map((total, i) => {
      const split = total - (laps[i - 1] ?? 0);
      return el("tr", {},
        el("th", {}, String(i + 1)),
        el("td", {}, format(split)),
        el("td", {}, format(total))
      );
    });
    listWrap.replaceChildren(el("table", { class: "mvb-ttable" },
      el("thead", {}, el("tr", {}, el("th", {}, "#"), el("th", {}, "Lap"), el("th", {}, "Total"))),
      el("tbody", {}, ...rows)
    ));
  }

  function lapsText() {
    return laps.map((total, i) => {
      const split = total - (laps[i - 1] ?? 0);
      return `${i + 1}\t${format(split)}\t${format(total)}`;
    }).join("\n");
  }

  function toggle() {
    if (running) {
      elapsed = current();
      running = false;
      cancelAnimationFrame(frame);
      label().textContent = "Resume";
    } else {
      startAt = performance.now();
      running = true;
      label().textContent = "Pause";
      frame = requestAnimationFrame(loop);
    }
    paint();
    updateButtons();
  }

  function lap() {
    if (!running) return;
    laps.push(current());
    renderLaps();
    updateButtons();
  }

  function reset() {
    running = false;
    cancelAnimationFrame(frame);
    elapsed = 0;
    laps = [];
    label().textContent = "Start";
    paint();
    renderLaps();
    updateButtons();
  }

  startButton.addEventListener("click", toggle);
  lapButton.addEventListener("click", lap);
  resetButton.addEventListener("click", reset);

  const card = toolcard({
    body: bench(
      stack(panel("Laps", listWrap)),
      stack(display)
    ),
    foot: actions(copyLaps, resetButton, lapButton, startButton),
  });
  slot.append(card.node);
  paint();
  renderLaps();
  updateButtons();

  return {
    unmount() {
      cancelAnimationFrame(frame);
      running = false;
    },
  };
}

export default { mount };
