// Heads or tails with a running count that survives a page change.
import { el, button, bench, stack, panel, output, actions, readPin, writePin, randomInt, toolcard } from "../core.js";

export function mount(slot) {
  const PIN = "coin-flip";
  const saved = readPin(PIN, { heads: 0, tails: 0 });
  let heads = Number(saved.heads) || 0;
  let tails = Number(saved.tails) || 0;

  const coin = el("div", { class: "mvb-coin", role: "img", "aria-label": "Coin" }, "?");
  const result = output({ rows: 1 });
  const tally = el("p", { class: "mvb-flip__tally", "aria-live": "polite" });

  function render(decision) {
    result.write(decision ? `${decision}` : "");
    const total = heads + tails;
    tally.textContent = total ? `Heads ${heads}, tails ${tails}. ${total} flips.` : "No flips yet.";
    writePin(PIN, { heads, tails });
  }

  const flipButton = button("Flip", { kind: "fill" });
  const resetButton = button("Reset the count", { kind: "quiet" });

  flipButton.addEventListener("click", () => {
    coin.classList.remove("mvb-toss");
    void coin.offsetWidth;
    coin.classList.add("mvb-toss");
    setTimeout(() => {
      const isHeads = randomInt(2) === 0;
      if (isHeads) heads++;
      else tails++;
      coin.textContent = isHeads ? "H" : "T";
      render(isHeads ? "Heads" : "Tails");
    }, 400);
  });

  resetButton.addEventListener("click", () => {
    heads = 0;
    tails = 0;
    coin.textContent = "?";
    render("");
  });

  const card = toolcard({
    body: bench(
      stack(panel("Coin", coin)),
      stack(panel("Result", result), tally)
    ),
    foot: actions(resetButton, flipButton),
  });
  slot.append(card.node);
  render("");

  return {};
}

export default { mount };