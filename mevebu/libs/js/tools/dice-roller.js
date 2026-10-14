// Polyhedral dice from d4 to d20, one die or many, with each result shown.
import { el, randomInt, chipRow, numberInput, button, bench, stack, panel, output, actions, readPin, writePin, toolcard } from "../core.js";

const SIDES = [4, 6, 8, 10, 12, 20];

export function mount(slot) {
  const PIN = "dice-roller";
  const saved = readPin(PIN, { sides: 6, count: "3" });
  let sides = SIDES.includes(Number(saved.sides)) ? Number(saved.sides) : 6;

  const chips = chipRow(SIDES.map((value) => ({ value, label: `d${value}` })), {
    value: sides,
    label: "Die",
    onChange: (value) => {
      sides = value;
      roll();
    },
  });
  const countField = numberInput({ value: saved.count ?? "3", min: "1", max: "50", "aria-label": "How many dice" });
  const faces = el("div", { class: "mvb-faces", "aria-live": "polite" });
  const sum = output({ rows: 1 });
  const rollButton = button("Roll", { icon: "dices", kind: "fill" });

  function totalCount() {
    return Math.max(1, Math.min(50, parseInt(countField.value || "1", 10) || 1));
  }

  function roll() {
    const total = totalCount();
    const rolls = Array.from({ length: total }, () => 1 + randomInt(sides));
    faces.replaceChildren(...rolls.map((value) => el("span", { class: "mvb-die" }, String(value))));
    sum.write(String(rolls.reduce((a, b) => a + b, 0)));
    writePin(PIN, { sides, count: String(total) });
  }

  // A new die or a new count rolls right away. The button stays for a fresh throw.
  rollButton.addEventListener("click", () => {
    countField.value = String(totalCount());
    roll();
  });
  countField.addEventListener("input", roll);
  countField.addEventListener("change", () => {
    countField.value = String(totalCount());
  });

  const card = toolcard({
    body: bench(
      stack(panel("Die", chips), panel("Dice to roll", countField)),
      stack(panel("Results", faces), panel("Total", sum))
    ),
    foot: actions(rollButton),
  });
  slot.append(card.node);
  roll();

  return {};
}

export default { mount };