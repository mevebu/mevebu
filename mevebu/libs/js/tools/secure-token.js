// Random tokens from the browser random source, in hex or URL-safe Base64.
import { numberInput, chipRow, output, notice, button, copyButton, bench, stack, panel, actions, toolcard } from "../core.js";

function toHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toBase64Url(bytes) {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function mount(slot) {
  const bytesField = numberInput({ min: "1", max: "256", value: "32", "aria-label": "Byte length" });
  const result = output({ rows: 3 });
  const error = notice("error");
  let format = "hex";

  const formats = chipRow(
    [{ value: "hex", label: "Hex" }, { value: "base64", label: "Base64 URL-safe" }],
    { value: format, label: "Format", onChange: (value) => { format = value; draw(); } }
  );

  function draw() {
    error.write("");
    const size = parseInt(bytesField.value, 10);
    if (!Number.isFinite(size) || size < 1 || size > 256) {
      result.write("");
      error.write("Enter a byte length between 1 and 256.");
      return;
    }
    const bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);
    result.write(format === "hex" ? toHex(bytes) : toBase64Url(bytes));
  }

  bytesField.addEventListener("input", draw);
  const generateButton = button("Generate", { icon: "refresh-cw", kind: "fill" });
  generateButton.addEventListener("click", draw);

  const card = toolcard({
    body: bench(
      stack(
        panel("Bytes", bytesField),
        panel("Format", formats),
        error
      ),
      stack(panel("Token", result))
    ),
    foot: actions(copyButton(() => result.textContent, "Copy token"), generateButton),
  });
  slot.append(card.node);
  draw();

  return {};
}

export default { mount };
