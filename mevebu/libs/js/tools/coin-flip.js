// Heads or tails with a running count that survives a page change.
import { el, button, bench, stack, panel, actions, readPin, writePin, randomInt, toolcard } from "../core.js";

// A toss is one flip: a click while the coin is still turning replaces the turn
// in progress instead of queueing another one behind it.
const TOSS_MS = 400;

/** A tally tile. The value is the node the tool writes to. */
function tile(key) {
  const value = el("span", { class: "mvb-stat__v" }, "0");
  const row = el("div", { class: "mvb-stat" }, value, el("span", { class: "mvb-stat__k" }, key));
  return { row, value };
}

export function mount(slot) {
  const PIN = "coin-flip";
  const saved = readPin(PIN, { heads: 0, tails: 0 });
  let heads = Number(saved.heads) || 0;
  let tails = Number(saved.tails) || 0;
  let timer = 0;

  const coin = el("div", { class: "mvb-coin", role: "img", "aria-label": "Coin, not flipped yet" }, "?");
  const verdict = el("p", { class: "mvb-flip__result min-h-7", "aria-live": "polite" });
  const headsTile = tile("Heads");
  const tailsTile = tile("Tails");
  const totalTile = tile("Total");
  const stats = el("div", { class: "mvb-stats" }, headsTile.row, tailsTile.row, totalTile.row);

  function render(decision) {
    verdict.textContent = decision;
    coin.setAttribute("aria-label", decision ? `Coin: ${decision.toLowerCase()}` : "Coin, not flipped yet");
    headsTile.value.textContent = String(heads);
    tailsTile.value.textContent = String(tails);
    totalTile.value.textContent = String(heads + tails);
    writePin(PIN, { heads, tails });
  }

  const flipButton = button("Flip", { kind: "fill" });
  const resetButton = button("Reset the count", { kind: "quiet" });

  flipButton.addEventListener("click", () => {
    clearTimeout(timer);
    coin.classList.remove("mvb-toss");
    void coin.offsetWidth;
    coin.classList.add("mvb-toss");
    timer = setTimeout(() => {
      const isHeads = randomInt(2) === 0;
      if (isHeads) heads++;
      else tails++;
      coin.textContent = isHeads ? "H" : "T";
      render(isHeads ? "Heads" : "Tails");
    }, TOSS_MS);
  });

  resetButton.addEventListener("click", () => {
    clearTimeout(timer);
    heads = 0;
    tails = 0;
    coin.textContent = "?";
    render("");
  });

  const card = toolcard({
    body: bench(
      stack(panel("Coin", coin)),
      stack(panel("Result", verdict), stats)
    ),
    foot: actions(resetButton, flipButton),
  });
  slot.append(card.node);
  render("");

  return {
    unmount() {
      clearTimeout(timer);
    },
  };
}

export default { mount };