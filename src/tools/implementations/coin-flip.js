// Coin Flip — heads/tails with running tally
import { el, icon, cryptoRandomInt } from "../../lib/dom.js";

export function mount(container) {
  let heads = 0, tails = 0;
  const coin = el("div", { class: "coin" }, el("span", {}, "?"));
  const result = el("div", { class: "flip__result" }, "Flip the coin!");
  const tally = el("div", { class: "flip__tally" });
  const flipBtn = el("button", { class: "btn btn--accent", type: "button" }, icon("refresh-ccw"), "Flip");
  const resetLink = el("button", { class: "linklike", type: "button" }, "reset tally");

  function renderTally() {
    tally.textContent = `Heads ${heads} · Tails ${tails} · (${heads + tails} flips)`;
  }

  flipBtn.addEventListener("click", () => {
    coin.classList.remove("is-flipping");
    void coin.offsetWidth; // restart animation
    coin.classList.add("is-flipping");
    setTimeout(() => {
      const isHeads = cryptoRandomInt(2) === 0;
      if (isHeads) heads++; else tails++;
      coin.textContent = isHeads ? "H" : "T";
      coin.classList.toggle("coin--tails", !isHeads);
      result.textContent = isHeads ? "🪙 Heads!" : "🪙 Tails!";
      renderTally();
    }, 450);
  });
  resetLink.addEventListener("click", () => { heads = tails = 0; renderTally(); result.textContent = "Tally cleared."; });

  container.append(el("div", { class: "center-col tstack" }, coin, flipBtn, result, tally, resetLink));
  renderTally();
  return {};
}
export default { mount };
