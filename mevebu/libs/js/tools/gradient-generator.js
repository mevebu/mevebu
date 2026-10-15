// Make a CSS gradient: linear or radial, with color stops you control.
import { el, bench, stack, panel, chipRow, colorInput, rangeInput, output, button, copyButton, actions, toolcard } from "../core.js";

export function mount(slot) {
  let type = "linear";
  let angle = 90;
  const stops = [
    { color: "#f5b942", pos: 0 },
    { color: "#8a2be2", pos: 100 },
  ];

  const stopsBox = el("div", { class: "mvb-stack" });
  const previewBox = el("div", { class: "mvb-preview__box" });
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
    const val = el("span", { class: "mvb-slider__val" }, `${stop.pos}%`);
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

    return el("div", { class: "mvb-row" }, picker, range, val, remove);
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
  const angleVal = el("span", { class: "mvb-slider__val" }, `${angle}deg`);
  const angleRow = el(
    "div",
    { class: "mvb-slider" },
    el("span", { class: "mvb-slider__label" }, "Angle"),
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
      stack(el("div", { class: "mvb-preview" }, previewBox), code)
    ),
    foot: actions(copyButton(() => `background: ${gradientCss()};`, "Copy CSS", "fill")),
  });
  slot.append(card.node);
  paintStops();
  update();

  return {};
}

export default { mount };
