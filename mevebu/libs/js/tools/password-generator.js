// Random passwords from the groups you pick, with a strength reading in bits.
import { el, toast, copyText, rangeInput, toggleRow, button, bench, stack, panel, notice, textInput, actions, toolcard } from "../core.js";

const SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?",
};

export function mount(slot) {
  const lengthField = rangeInput({ min: "6", max: "64", value: "16", "aria-label": "Length" });
  const lengthLabel = el("span", { class: "mvb-field__label" });

  function showLength() {
    lengthLabel.textContent = `Length: ${lengthField.value}`;
  }

  const groups = toggleRow([
    { value: "lower", label: "a to z" },
    { value: "upper", label: "A to Z" },
    { value: "digits", label: "0 to 9" },
    { value: "symbols", label: "Symbols" },
  ]);

  const secret = textInput({ class: "mvb-in mvb-in--mono", readonly: true, "aria-label": "Password", placeholder: "Press Generate" });
  const meter = el("div", { class: "mvb-meter", role: "img", "aria-label": "Strength" }, el("div", { class: "mvb-meter__fill" }));
  const strength = notice("note");
  const error = notice("error");

  const generateButton = button("Generate", { kind: "fill" });
  const copyButton = button("Copy", { icon: "copy" });

  function pool() {
    return groups.values().map((key) => SETS[key]).join("");
  }

  function draw() {
    const source = pool();
    const fill = meter.querySelector(".mvb-meter__fill");
    if (!source) {
      secret.value = "";
      fill.style.width = "0%";
      fill.className = "mvb-meter__fill";
      meter.setAttribute("aria-label", "Strength");
      strength.write("");
      error.write("Pick at least one group above.");
      return;
    }
    error.write("");
    const length = parseInt(lengthField.value, 10);
    const bytes = new Uint32Array(length);
    const limit = Math.floor(0xffffffff / source.length) * source.length;
    let password = "";
    for (let i = 0; i < length; i++) {
      let value;
      do {
        crypto.getRandomValues(bytes.subarray(i, i + 1));
        value = bytes[i];
      } while (value >= limit);
      password += source[value % source.length];
    }
    secret.value = password;
    showLength();
    const bits = Math.round(length * Math.log2(source.length));
    const word = bits < 50 ? "weak" : bits < 90 ? "good" : "strong";
    fill.style.width = `${Math.min(100, (bits / 128) * 100)}%`;
    fill.className = `mvb-meter__fill ${bits < 50 ? "mvb-weak" : bits < 90 ? "mvb-ok" : "mvb-strong"}`;
    // The bar is colour only, so the reading it stands for also goes on the bar itself.
    meter.setAttribute("aria-label", `Strength: ${bits} bits, ${word}`);
    strength.write(`${bits} bits, ${word}.`);
  }

  lengthField.addEventListener("input", () => { showLength(); draw(); });
  groups.addEventListener("change", () => draw());
  generateButton.addEventListener("click", () => draw());
  copyButton.addEventListener("click", async () => {
    if (!secret.value) return toast("Generate a password first");
    toast((await copyText(secret.value)) ? "Copied" : "Copy failed");
  });

  const card = toolcard({
    body: bench(
      stack(panel(lengthLabel, lengthField), groups, error),
      stack(panel("Password", secret), meter, strength)
    ),
    foot: actions(copyButton, generateButton),
  });
  slot.append(card.node);
  draw();

  return {};
}

export default { mount };