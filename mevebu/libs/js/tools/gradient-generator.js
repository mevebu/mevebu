// Make a CSS gradient: linear or radial, with color stops you control.
import { el, bench, stack, panel, chipRow, colorInput, rangeInput, output, button, copyButton, actions, toolcard } from "../core.js";

export function mount(slot) {
  let type = "linear";
  let angle = 90;
  const stops = [
    { color: "#f5b942", pos: 0 },
    { color: "#8a2be2", pos: 100 }];

  const stopsBox = el("div", { class: "grid content-start gap-4" });
  const previewBox = el("div", { class: "grid h-[120px] w-[min(200px,100%)] place-items-center bg-jade text-2xs text-on-jade" });
  const code = output();

  function gradientCss() {
    const list = stops.map((stop) => `${stop.color} ${stop.pos}%`).join(", ");
    return type === "linear" ? `linear-gradient(${angle}deg, ${list})` : `radial-gradient(circle, ${list})`;
  }

  function update() {
    const value = gradientCss();
    previewBox.style.background = value;
    code.write(`background: ${value};`);
  }

  function stopRow(stop, index) {
    const picker = colorInput({ value: stop.color, "aria-label": "Stop color" });
    picker.addEventListener("input", () => { stop.color = picker.value; update(); });

    const range = rangeInput({ min: 0, max: 100, value: stop.pos, "aria-label": "Stop position" });
    range.style.flex = "1";
    const val = el("span", { class: "text-end font-mono text-2xs text-ink-2" }, `${stop.pos}%`);
    range.addEventListener("input", () => {
      stop.pos = parseInt(range.value, 10) || 0;
      val.textContent = `${stop.pos}%`;
      update();
    });

    const remove = button("", { icon: "minus", "aria-label": "Remove stop" });
    remove.disabled = stops.length <= 2;
    remove.addEventListener("click", () => {
      stops.splice(index, 1);
      paintStops();
      update();
    });

    return el("div", { class: "flex min-w-0 flex-wrap items-center gap-2" }, picker, range, val, remove);
  }

  function paintStops() {
    stopsBox.replaceChildren(...stops.map((stop, i) => stopRow(stop, i)));
  }

  const addStop = button("Add stop", { icon: "plus" });
  addStop.addEventListener("click", () => {
    const last = stops[stops.length - 1];
    const prev = stops[stops.length - 2];
    const pos = Math.round(((prev?.pos ?? 0) + last.pos) / 2);
    stops.push({ color: "#ffffff", pos: Number.isFinite(pos) ? pos : 50 });
    paintStops();
    update();
  });

  const angleInput = rangeInput({ min: 0, max: 360, value: angle, "aria-label": "Angle" });
  const angleVal = el("span", { class: "text-end font-mono text-2xs text-ink-2" }, `${angle}deg`);
  const angleRow = el(
    "div",
    { class: "grid items-center gap-2.5 [grid-template-columns:88px_minmax(0,1fr)_62px] max-[45rem]:[grid-template-columns:minmax(0,1fr)_62px]" },
    el("span", { class: "text-2xs font-semibold text-ink-2 max-[45rem]:col-span-2" }, "Angle"),
    angleInput,
    angleVal
  );
  angleInput.addEventListener("input", () => {
    angle = parseInt(angleInput.value, 10) || 0;
    angleVal.textContent = `${angle}deg`;
    update();
  });

  const typeChips = chipRow(
    [{ value: "linear", label: "Linear" }, { value: "radial", label: "Radial" }],
    { value: type, label: "Type", onChange: (value) => { type = value; angleRow.hidden = value !== "linear"; update(); } }
  );

  const card = toolcard({
    body: bench(
      stack(panel("Type", typeChips), angleRow, panel("Color stops", stopsBox), addStop),
      stack(el("div", { class: "grid min-h-40 place-items-center overflow-hidden rounded-r1 border border-orbit bg-deck-2 p-[22px]" }, previewBox), code)
    ),
    foot: actions(copyButton(() => `background: ${gradientCss()};`, "Copy CSS", "fill"))});
  slot.append(card.node);
  paintStops();
  update();

  return {};
}

export default { mount };
