// Masks emails, card numbers and phone numbers in pasted text.
import { el, textArea, output, toggleRow, copyButton, bench, stack, panel, actions, toolcard } from "../core.js";

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const CARD = /\b\d[\d -]{11,}\d\b/g;
const PHONE = /\b\+?\d[\d ().-]{5,}\d\b/g;

function maskDigits(value, keep) {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= keep) return value;
  const cutoff = digits.length - keep;
  let seen = 0;
  return value.replace(/\d/g, (digit) => (seen++ < cutoff ? "*" : digit));
}

function maskEmail(value) {
  return value.replace(EMAIL, (email) => {
    const [local, domain] = email.split("@");
    const head = local.slice(0, 1);
    return `${head}${"*".repeat(Math.max(1, local.length - 1))}@${domain}`;
  });
}

export function mount(slot) {
  const source = textArea({ rows: 12, "aria-label": "Values", placeholder: "Paste values, one per line" });
  const result = output({ rows: 12 });

  const kinds = toggleRow([
    { value: "email", label: "Email" },
    { value: "card", label: "Card number" },
    { value: "phone", label: "Phone number" },
  ]);

  function run() {
    const on = kinds.values();
    const lines = source.value.split("\n").map((line) => {
      let text = line;
      if (on.includes("email")) text = maskEmail(text);
      if (on.includes("card")) text = text.replace(CARD, (value) => (value.replace(/\D/g, "").length >= 13 ? maskDigits(value, 4) : value));
      if (on.includes("phone")) {
        text = text.replace(PHONE, (value) => {
          const digits = value.replace(/\D/g, "").length;
          return digits >= 7 && digits <= 12 ? maskDigits(value, 2) : value;
        });
      }
      return text;
    });
    result.write(lines.join("\n"));
  }

  source.addEventListener("input", run);
  kinds.addEventListener("change", run);

  const card = toolcard({
    body: bench(
      stack(
        panel("Values", source),
        panel("Mask", kinds),
        el("p", { class: "mvb-note" }, "Masking runs in this tab. Check the result before sharing.")
      ),
      stack(panel("Masked", result))
    ),
    foot: actions(copyButton(() => result.textContent, "Copy masked", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };
