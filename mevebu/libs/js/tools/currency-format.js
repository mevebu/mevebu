// A number shown as a currency for a chosen locale, with no rate applied.
import { el, bench, stack, panel, textInput, selectInput, notice, copyButton, actions, toolcard } from "../core.js";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "IDR", "INR", "AUD", "CAD", "CNY", "BRL", "SGD", "CHF"];

const LOCALES = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "de-DE", label: "German" },
  { value: "fr-FR", label: "French" },
  { value: "es-ES", label: "Spanish" },
  { value: "id-ID", label: "Indonesian" },
  { value: "hi-IN", label: "Hindi" },
  { value: "ja-JP", label: "Japanese" },
  { value: "pt-BR", label: "Portuguese (Brazil)" }];

function format(locale, currency, value) {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
  } catch {
    return String(value);
  }
}

export function mount(slot) {
  const value = textInput({ value: "1234.5", inputmode: "decimal", "aria-label": "Amount" });
  const currency = selectInput(CURRENCIES, { value: "USD", "aria-label": "Currency" });
  const locale = selectInput(LOCALES, { value: "en-US", "aria-label": "Locale" });

  const amount = el("span", { class: "wrap-anywhere text-xl font-bold tracking-[-0.02em] tabular-nums" }, "-");
  const readout = el("div", { class: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]" },
    el("div", { class: "grid gap-0.5 rounded-r1 border border-orbit bg-deck-2 px-3.5 py-3" }, amount, el("span", { class: "text-2xs font-semibold text-ink-3" }, "Formatted")));

  const note = notice("note");
  note.write("The amount is formatted, not converted. No exchange rate is applied.");

  let formatted = "";

  function run() {
    const parsed = Number(value.value.trim());
    formatted = value.value.trim() === "" || !Number.isFinite(parsed)
      ? ""
      : format(locale.value, currency.value, parsed);
    amount.textContent = formatted || "-";
  }

  value.addEventListener("input", run);
  currency.addEventListener("change", run);
  locale.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(
        panel("Amount", value),
        panel("Currency", currency),
        panel("Locale", locale)
      ),
      stack(readout, note)
    ),
    foot: actions(copyButton(() => formatted, "Copy amount", "fill"))});
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
