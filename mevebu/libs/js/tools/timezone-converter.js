// Converts a wall clock time from one zone to another using the browser's zone rules.
import { el, bench, stack, panel, textInput, selectInput, notice, copyButton, actions, toolcard } from "../core.js";

const FALLBACK_ZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Africa/Cairo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney"];

function zoneList() {
  let zones = FALLBACK_ZONES;
  if (typeof Intl.supportedValuesOf === "function") {
    try {
      const supported = Intl.supportedValuesOf("timeZone");
      if (Array.isArray(supported) && supported.length) zones = supported;
    } catch {
      zones = FALLBACK_ZONES;
    }
  }
  const out = zones.slice();
  if (!out.includes("UTC")) out.unshift("UTC");
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (local && !out.includes(local)) out.unshift(local);
  return out;
}

function parseDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
  return { year, month, day };
}

function parseTime(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

function offsetMs(timeZone, date) {
  const parts = {};
  const format = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"});
  for (const part of format.formatToParts(date)) parts[part.type] = part.value;
  const hour = parts.hour === "24" ? 0 : Number(parts.hour);
  const asUTC = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), hour, Number(parts.minute), Number(parts.second));
  return asUTC - date.getTime();
}

function wallToInstant(day, time, timeZone) {
  const guess = Date.UTC(day.year, day.month, day.day, time.hours, time.minutes);
  const offset = offsetMs(timeZone, new Date(guess));
  return new Date(guess - offset);
}

const pad = (n) => String(n).padStart(2, "0");

const kvRow = (key, value) =>
  el("div", { class: "grid gap-3 bg-deck px-3 py-[9px] [grid-template-columns:minmax(90px,34%)_minmax(0,1fr)]" }, el("span", { class: "wrap-anywhere text-2xs font-semibold text-ink-2" }, key), el("span", { class: "wrap-anywhere font-mono text-2xs" }, value));

export function mount(slot) {
  const zones = zoneList();
  const today = new Date();
  const date = textInput({ type: "date", value: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`, "aria-label": "Date" });
  const time = textInput({ type: "time", value: "12:00", "aria-label": "Time" });
  const fromZone = selectInput(zones, { value: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", "aria-label": "Source zone" });
  const toZone = selectInput(zones, { value: "UTC", "aria-label": "Target zone" });

  const target = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const utc = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const diff = el("span", { class: "wrap-anywhere font-mono text-2xs" }, "-");
  const kv = el("div", { class: "grid gap-px overflow-hidden rounded-r1 border border-orbit bg-orbit" }, kvRow("Target time", target), kvRow("UTC", utc), kvRow("Offset", diff));
  const error = notice("error");
  let text = "";

  function clear() {
    target.textContent = "-";
    utc.textContent = "-";
    diff.textContent = "-";
    text = "";
  }

  function run() {
    error.write("");
    const day = parseDate(date.value);
    const clock = parseTime(time.value);
    if (!day || !clock) {
      clear();
      error.write("Pick a valid date and time.");
      return;
    }
    try {
      const instant = wallToInstant(day, clock, fromZone.value);
      const formatted = new Intl.DateTimeFormat(undefined, {
        timeZone: toZone.value,
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"}).format(instant);
      const utcText = `${instant.getUTCFullYear()}-${pad(instant.getUTCMonth() + 1)}-${pad(instant.getUTCDate())} ${pad(instant.getUTCHours())}:${pad(instant.getUTCMinutes())} UTC`;
      const deltaHours = (offsetMs(toZone.value, instant) - offsetMs(fromZone.value, instant)) / 3600000;
      const sign = deltaHours > 0 ? "+" : deltaHours < 0 ? "-" : "";
      const diffText = deltaHours === 0 ? "Same offset" : `${sign}${Math.abs(deltaHours)} hours`;
      target.textContent = formatted;
      utc.textContent = utcText;
      diff.textContent = diffText;
      text = `${formatted} (${toZone.value})`;
    } catch {
      clear();
      error.write("That zone could not be resolved.");
    }
  }

  for (const input of [date, time]) input.addEventListener("input", run);
  fromZone.addEventListener("change", run);
  toZone.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(panel("Date", date), panel("Time", time), panel("From", fromZone), panel("To", toZone), error),
      stack(panel("Result", kv))
    ),
    foot: actions(copyButton(() => text, "Copy result", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
