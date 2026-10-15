// Draws one or more names from a list, every entry with equal odds.
import { el, toast, copyText, shuffle, randomInt, debounce, bench, stack, panel, textArea, numberInput, checkbox, button, output, readPin, writePin, actions, toolcard } from "../core.js";

export function mount(slot) {
  const PIN = "name-picker";
  const saved = readPin(PIN, { entries: "Ana\nBudi\nCitra\nDimas\nElena\nFajar\nGita\nHendra", winners: "1", unique: true });

  const listField = textArea({ value: saved.entries ?? "", rows: 8, "aria-label": "Entries, one per line", placeholder: "One entry per line" });
  const countField = numberInput({ value: saved.winners ?? "1", min: "1", max: "500", "aria-label": "How many to draw" });
  const uniqueBox = checkbox("No repeats", { checked: saved.unique !== false });
  const notify = el("p", { class: "border-s-[3px] border-transparent ps-2 text-sm text-ink-3" });

  const drawButton = button("Draw", { icon: "play", kind: "fill" });
  const copyButton = button("Copy", { icon: "copy" });
  const result = output();
  let current = [];

  function entries() {
    const raw = listField.value.includes(",") && !listField.value.includes("\n")
      ? listField.value.split(",")
      : listField.value.split(/\n+/);
    return raw.map((line) => line.trim()).filter(Boolean);
  }

  function draw(syncInput = false) {
    const list = entries();
    if (!list.length) {
      current = [];
      result.write("");
      notify.textContent = "Add entries to draw.";
      return;
    }
    const wants = Math.max(1, parseInt(countField.value || "1", 10) || 1);
    const total = uniqueBox.input.checked ? Math.min(wants, list.length) : Math.min(wants, 500);
    if (syncInput) countField.value = String(total);
    current = uniqueBox.input.checked
      ? shuffle(list).slice(0, total)
      : Array.from({ length: total }, () => list[randomInt(list.length)]);
    result.write(current.join("\n"));
    notify.textContent = `${current.length} drawn from ${list.length}.`;
    writePin(PIN, { entries: listField.value, winners: String(current.length), unique: uniqueBox.input.checked });
  }

  // Editing the list, the count or the repeat rule redraws right away. The
  // button stays for a fresh draw with the same settings.
  drawButton.addEventListener("click", () => draw(true));
  copyButton.addEventListener("click", async () => {
    if (!current.length) return toast("Draw first, then copy");
    toast((await copyText(result.textContent)) ? "Copied" : "Copy failed");
  });
  listField.addEventListener("input", debounce(() => draw(false), 200));
  countField.addEventListener("input", () => draw(false));
  countField.addEventListener("change", () => draw(true));
  uniqueBox.input.addEventListener("change", () => draw(true));

  const card = toolcard({
    body: bench(
      stack(panel("Entries", listField), panel("Winners", countField), panel(null, uniqueBox)),
      stack(panel("Drawn", result), notify)
    ),
    foot: actions(copyButton, drawButton)});
  slot.append(card.node);
  draw();

  return {};
}

export default { mount };