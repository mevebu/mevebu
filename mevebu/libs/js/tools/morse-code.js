// Text to Morse and back, with the beeps generated in the tab instead of a
// bundled audio file.
import { el, bench, stack, panel, textArea, chipRow, notice, copyButton, actions, toolcard, button, icon } from "../core.js";

const CODE = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....",
  I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.",
  Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..",
  0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-",
  5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.", "!": "-.-.--",
  "/": "-..-.", "(": "-.--.", ")": "-.--.-", "&": ".-...", ":": "---...",
  ";": "-.-.-.", "=": "-...-", "+": ".-.-.", "-": "-....-", "_": "..--.-",
  '"': ".-..-.", "$": "...-..-", "@": ".--.-.",
};

const REVERSE = new Map(Object.entries(CODE).map(([letter, code]) => [code, letter]));

function encode(text) {
  const missing = new Set();
  const words = text.toUpperCase().split(/\s+/).filter(Boolean).map((word) => {
    const letters = [];
    for (const character of word) {
      if (CODE[character]) letters.push(CODE[character]);
      else missing.add(character);
    }
    return letters.join(" ");
  }).filter(Boolean);
  return { value: words.join(" / "), missing: [...missing] };
}

function decode(text) {
  const cleaned = text.replaceAll("\u00b7", ".").replaceAll("\u2013", "-").replaceAll("\u2212", "-").trim();
  if (!cleaned) return { value: "", missing: [] };
  const missing = new Set();
  const words = cleaned.split(/\s*\/\s*|\s{3,}/).filter(Boolean).map((word) =>
    word.trim().split(/\s+/).map((code) => {
      if (REVERSE.has(code)) return REVERSE.get(code);
      missing.add(code);
      return "";
    }).join(""));
  return { value: words.join(" "), missing: [...missing].filter(Boolean) };
}

export function mount(slot) {
  const textSide = textArea({ rows: 8, "aria-label": "Text", placeholder: "SOS" });
  const morseSide = textArea({ rows: 8, "aria-label": "Morse code", placeholder: "... --- ..." });
  const speed = chipRow([
    { value: 90, label: "Slow" },
    { value: 60, label: "Normal" },
    { value: 40, label: "Fast" },
  ], { value: 60, label: "Speed" });
  const warning = notice("warn");
  let syncing = false;
  let audio = null;
  let timer = 0;

  function fromText() {
    if (syncing) return;
    syncing = true;
    const result = encode(textSide.value);
    morseSide.value = result.value;
    warning.write(result.missing.length ? `No Morse code for: ${result.missing.join(" ")}` : "");
    syncing = false;
  }

  function fromMorse() {
    if (syncing) return;
    syncing = true;
    const result = decode(morseSide.value);
    textSide.value = result.value;
    warning.write(result.missing.length ? `Not a Morse sequence: ${result.missing.join(" ")}` : "");
    syncing = false;
  }

  function stop() {
    if (!audio) return;
    const current = audio;
    audio = null;
    clearTimeout(timer);
    current.close();
    playButton.replaceChildren(icon("play"), el("span", {}, "Play"));
  }

  function play() {
    if (audio) return stop();
    const code = morseSide.value.trim();
    if (!code) return warning.write("Type text or Morse code first.");
    warning.write("");
    const Context = window.AudioContext ?? window.webkitAudioContext;
    if (!Context) return warning.write("This browser cannot play audio.");
    const context = new Context();
    const unit = Number(speed.value) / 1000;
    const start = context.currentTime + 0.08;
    let at = start;
    const beep = (duration) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 620;
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(0.16, at + 0.006);
      gain.gain.setValueAtTime(0.16, at + duration - 0.006);
      gain.gain.linearRampToValueAtTime(0, at + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(at);
      oscillator.stop(at + duration + 0.01);
      at += duration;
    };
    for (const character of code) {
      if (character === ".") { beep(unit); at += unit; }
      else if (character === "-") { beep(unit * 3); at += unit; }
      else if (character === " ") at += unit * 3;
      else if (character === "/") at += unit * 7;
    }
    audio = context;
    playButton.replaceChildren(icon("square"), el("span", {}, "Stop"));
    timer = setTimeout(() => { if (audio === context) stop(); }, (at - start + 0.3) * 1000);
  }

  textSide.addEventListener("input", fromText);
  morseSide.addEventListener("input", fromMorse);

  const playButton = button("Play", { icon: "play", kind: "fill", onclick: play });

  const card = toolcard({
    body: bench(
      stack(panel("Text", textSide), panel("Speed", speed), warning),
      stack(panel("Morse code", morseSide)),
    ),
    foot: actions(copyButton(() => textSide.value, "Copy text"), copyButton(() => morseSide.value, "Copy Morse", "plain")),
    head: actions(playButton),
  });
  slot.append(card.node);
  textSide.value = "SOS";
  fromText();

  return {
    unmount() {
      stop();
    },
  };
}

export default { mount };
