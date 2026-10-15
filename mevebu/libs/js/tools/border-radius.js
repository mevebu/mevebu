// Round the corners of a box, each corner on its own or linked.
import { el, bench, stack, rangeInput, switchControl, output, copyButton, actions, toolcard } from "../core.js";

const KEYS = ["tl", "tr", "br", "bl"];

function slider(label, value) {
  const input = rangeInput({ min: 0, max: 100, value, "aria-label": label });
  const val = el("span", { class: "text-end font-mono text-2xs text-ink-2" }, `${value}px`);
  const node = el(
    "div",
    { class: "grid items-center gap-2.5 [grid-template-columns:88px_minmax(0,1fr)_62px] max-[45rem]:[grid-template-columns:minmax(0,1fr)_62px]" },
    el("span", { class: "text-2xs font-semibold text-ink-2 max-[45rem]:col-span-2" }, label),
    input,
    val
  );
  node.input = input;
  node.value = () => parseFloat(input.value) || 0;
  node.setVal = (text) => { val.textContent = text; };
  return node;
}

export function mount(slot) {
  const corners = { tl: 16, tr: 16, br: 16, bl: 16 };
  let linked = true;

  const sliders = {
    tl: slider("Top left", corners.tl),
    tr: slider("Top right", corners.tr),
    br: slider("Bottom right", corners.br),
    bl: slider("Bottom left", corners.bl)};

  const linkSwitch = switchControl("Link corners", { checked: true });
  const previewBox = el("div", { class: "grid h-[120px] w-[min(200px,100%)] place-items-center bg-jade text-2xs text-on-jade" });
  const code = output();

  function css() {
    const { tl, tr, br, bl } = corners;
    if (tl === tr && tr === br && br === bl) return `border-radius: ${tl}px;`;
    return `border-radius: ${tl}px ${tr}px ${br}px ${bl}px;`;
  }

  function update() {
    previewBox.style.borderRadius = `${corners.tl}px ${corners.tr}px ${corners.br}px ${corners.bl}px`;
    code.write(css());
  }

  function sync(value) {
    for (const key of KEYS) {
      corners[key] = value;
      sliders[key].input.value = value;
      sliders[key].setVal(`${value}px`);
    }
  }

  for (const key of KEYS) {
    const control = sliders[key];
    control.input.addEventListener("input", () => {
      const value = control.value();
      if (linked) sync(value);
      else corners[key] = value;
      control.setVal(`${value}px`);
      update();
    });
  }

  linkSwitch.input.addEventListener("change", () => {
    linked = linkSwitch.input.checked;
    if (linked) {
      sync(corners.tl);
      update();
    }
  });

  const card = toolcard({
    body: bench(
      stack(linkSwitch, sliders.tl, sliders.tr, sliders.br, sliders.bl),
      stack(el("div", { class: "grid min-h-40 place-items-center overflow-hidden rounded-r1 border border-orbit bg-deck-2 p-[22px]" }, previewBox), code)
    ),
    foot: actions(copyButton(css, "Copy CSS", "fill"))});
  slot.append(card.node);
  update();

  return {};
}

export default { mount };
