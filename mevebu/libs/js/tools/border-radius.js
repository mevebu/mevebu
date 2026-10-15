// Round the corners of a box, each corner on its own or linked.
import { el, bench, stack, rangeInput, switchControl, output, copyButton, actions, toolcard } from "../core.js";

const KEYS = ["tl", "tr", "br", "bl"];

function slider(label, value) {
  const input = rangeInput({ min: 0, max: 100, value, "aria-label": label });
  const val = el("span", { class: "mvb-slider__val" }, `${value}px`);
  const node = el(
    "div",
    { class: "mvb-slider" },
    el("span", { class: "mvb-slider__label" }, label),
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
    bl: slider("Bottom left", corners.bl),
  };

  const linkSwitch = switchControl("Link corners", { checked: true });
  const previewBox = el("div", { class: "mvb-preview__box" });
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
      stack(el("div", { class: "mvb-preview" }, previewBox), code)
    ),
    foot: actions(copyButton(css, "Copy CSS", "fill")),
  });
  slot.append(card.node);
  update();

  return {};
}

export default { mount };
