// Spin the Wheel — canvas wheel with eased spin, crypto RNG
import { el, icon, toast, cryptoRandomInt } from "../../lib/dom.js";

const PALETTE = ["#f59e0b", "#ef4444", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6", "#f97316"];

export function mount(container) {
  const ta = el("textarea", {
    class: "tinput ttextarea", rows: 6, spellcheck: "false",
    placeholder: "One option per line…\nAlice\nBob\nCharlie",
  });
  ta.value = "Alice\nBob\nCharlie\nDiana\nEthan";

  const canvas = el("canvas", { width: 420, height: 420, class: "wheel" });
  const ctx = canvas.getContext("2d");
  const status = el("div", { class: "wheel__status" }, "Add options, then spin 👇");
  const history = el("div", { class: "wheel__history" });

  const spinBtn = el("button", { class: "btn btn--accent", type: "button" }, icon("rotate-cw"), "Spin");
  spinBtn.addEventListener("click", spin);

  let rotation = 0; // radians
  let spinning = false;

  function options() {
    return ta.value.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  }

  function draw() {
    const opts = options();
    const w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 14;
    ctx.clearRect(0, 0, w, h);
    if (!opts.length) {
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text-faint").trim() || "#888";
      ctx.font = "15px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Type options on the left", cx, cy);
      return;
    }
    const seg = (Math.PI * 2) / opts.length;
    opts.forEach((o, i) => {
      const a0 = rotation + i * seg;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, a0, a0 + seg);
      ctx.closePath();
      ctx.fillStyle = PALETTE[i % PALETTE.length];
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.25)";
      ctx.stroke();
      // label
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a0 + seg / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = "600 14px system-ui";
      const label = o.length > 14 ? o.slice(0, 13) + "…" : o;
      ctx.fillText(label, r - 12, 5);
      ctx.restore();
    });
    // hub
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--bg-elev").trim() || "#222";
    ctx.fill();
    // pointer (top)
    ctx.beginPath();
    ctx.moveTo(cx - 10, 6);
    ctx.lineTo(cx + 10, 6);
    ctx.lineTo(cx, 26);
    ctx.closePath();
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "rgba(0,0,0,.35)";
    ctx.stroke();
    ctx.fill();
  }

  function spin() {
    if (spinning) return;
    const opts = options();
    if (opts.length < 2) return toast("Need at least 2 options.");
    spinning = true;
    spinBtn.disabled = true;
    const seg = (Math.PI * 2) / opts.length;
    const winner = cryptoRandomInt(opts.length);
    // final rotation so that winner slice sits under pointer (pointer at -PI/2)
    const target =
      Math.PI * 2 * 6 + // 6 full turns
      (-Math.PI / 2) - (winner * seg + seg / 2) -
      rotation;
    const startRot = rotation;
    const duration = 3200 + cryptoRandomInt(600);
    const t0 = performance.now();

    function frame(now) {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 4); // easeOutQuart
      rotation = startRot + target * eased;
      draw();
      if (p < 1) requestAnimationFrame(frame);
      else {
        spinning = false;
        spinBtn.disabled = false;
        status.textContent = `🎉 ${opts[winner]}`;
        history.prepend(el("span", { class: "wheel__chip" }, opts[winner]));
      }
    }
    requestAnimationFrame(frame);
  }

  ta.addEventListener("input", draw);

  container.append(el("div", { class: "split split--wide-right" },
    el("div", { class: "tstack" },
      el("label", { class: "tfield" }, el("span", { class: "tfield__label" }, "Options (one per line)"), ta)),
    el("div", { class: "tstack center-col" }, canvas, spinBtn, status, history)
  ));
  draw();

  return { unmount() { spinning = false; } };
}

export default { mount };
