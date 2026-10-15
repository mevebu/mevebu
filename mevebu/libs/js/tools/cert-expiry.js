// Days left until a certificate expiry date, with a warning threshold.
import { el, textInput, numberInput, notice, copyButton, bench, stack, panel, actions, toolcard } from "../core.js";

const DAY = 86400000;
const pad = (value) => String(value).padStart(2, "0");

function tile(label) {
  const value = el("span", { class: "mvb-stat__v" }, "-");
  const node = el("div", { class: "mvb-stat" }, value, el("span", { class: "mvb-stat__k" }, label));
  node.set = (text) => { value.textContent = text; };
  return node;
}

export function mount(slot) {
  const soon = new Date(Date.now() + 90 * DAY);
  const dateField = textInput({
    type: "date",
    value: `${soon.getFullYear()}-${pad(soon.getMonth() + 1)}-${pad(soon.getDate())}`,
    "aria-label": "Expiry date",
  });
  const warnField = numberInput({ min: "1", max: "365", value: "30", "aria-label": "Warn threshold in days" });

  const daysTile = tile("Days left");
  const weeksTile = tile("Weeks left");
  const statusTile = tile("Status");
  const stats = el("div", { class: "mvb-stats" }, daysTile, weeksTile, statusTile);
  const status = notice("note");
  const error = notice("error");
  let summary = "";

  function run() {
    error.write("");
    status.write("");
    summary = "";
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateField.value);
    if (!match) {
      daysTile.set("-");
      weeksTile.set("-");
      statusTile.set("-");
      error.write("Enter an expiry date.");
      return;
    }
    const expiry = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const days = Math.round((expiry - start) / DAY);
    const threshold = Math.max(0, parseInt(warnField.value, 10) || 0);

    daysTile.set(String(days));
    weeksTile.set(String(Math.round(days / 7)));
    const state = days < 0 ? "Expired" : days <= threshold ? "Soon" : "Valid";
    statusTile.set(state);

    if (days < 0) status.write(`Expired ${Math.abs(days)} days ago.`);
    else if (days === 0) status.write("Expires today.");
    else if (days <= threshold) status.write(`Inside the ${threshold} day warning window.`);

    summary = `Expires ${expiry.toLocaleDateString()}, ${days} days left, ${state}.`;
  }

  dateField.addEventListener("input", run);
  warnField.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(
        panel("Expiry date", dateField),
        panel("Warn within days", warnField),
        error
      ),
      stack(stats, status)
    ),
    foot: actions(copyButton(() => summary, "Copy summary", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
