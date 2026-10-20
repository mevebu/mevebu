// A dated series with a trend, a season and noise, so a demo chart looks like
// data instead of a random walk. Seeded, and the shape is previewed before it
// is downloaded.
import {
  el, toast, download, bench, stack, panel, numberInput, textInput, selectInput,
  button, actions, toolcard, notice,
} from "../core.js";
import { toCsv } from "../csv.js";
import { seeded, gaussian } from "../random.js";

const FREQUENCIES = [
  { value: "hour", label: "Hourly" },
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
];

function step(date, frequency) {
  const next = new Date(date);
  if (frequency === "hour") next.setHours(next.getHours() + 1);
  else if (frequency === "day") next.setDate(next.getDate() + 1);
  else if (frequency === "week") next.setDate(next.getDate() + 7);
  else next.setMonth(next.getMonth() + 1);
  return next;
}

function iso(date, frequency) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  if (frequency === "hour") return `${year}-${month}-${day} ${String(date.getHours()).padStart(2, "0")}:00`;
  return `${year}-${month}-${day}`;
}

export function mount(slot) {
  const start = el("input", {
    class: "w-full min-h-[var(--ctl)] rounded-r1 border border-orbit bg-deck px-3 py-2.5 text-base focus:border-jade focus:outline-none focus:ring-3 focus:ring-jade-soft",
    type: "date",
    value: (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    })(),
    "aria-label": "Start date",
  });
  const frequency = selectInput(FREQUENCIES, { value: "day", "aria-label": "Frequency" });
  const length = numberInput({ min: "2", max: "2000", step: "1", value: "60", "aria-label": "Points" });
  const base = numberInput({ value: "100", step: "1", "aria-label": "Base value" });
  const trend = numberInput({ value: "0.4", step: "0.1", "aria-label": "Trend per point" });
  const season = numberInput({ value: "12", step: "1", "aria-label": "Season amplitude" });
  const period = numberInput({ min: "2", max: "365", step: "1", value: "7", "aria-label": "Season period" });
  const noise = numberInput({ min: "0", max: "100", step: "0.5", value: "4", "aria-label": "Noise" });
  const seed = textInput({ value: "mevebu", "aria-label": "Seed", class: "font-mono" });
  const spikeDate = el("input", {
    class: "w-full min-h-[var(--ctl)] rounded-r1 border border-orbit bg-deck px-3 py-2.5 text-base focus:border-jade focus:outline-none focus:ring-3 focus:ring-jade-soft",
    type: "date",
    "aria-label": "Spike date",
  });
  const spikeMultiplier = numberInput({ value: "2", step: "0.1", "aria-label": "Spike multiplier" });

  const error = notice("warn");
  const summary = el("p", { class: "text-sm text-ink-2" });
  const chart = el("div", { class: "grid gap-2 rounded-r2 border border-orbit bg-deck-2 p-3" });
  const result = el("pre", { class: "m-0 max-h-56 overflow-auto rounded-r2 border border-orbit bg-deck-2 p-3 font-mono text-2xs leading-[1.6]" });

  let series = [];

  function build() {
    const count = Math.max(2, Math.min(2000, Number(length.value) || 2));
    const random = seeded(seed.value || "mevebu");
    const amp = Number(season.value) || 0;
    const slope = Number(trend.value) || 0;
    const spread = Number(noise.value) || 0;
    const wave = Math.max(2, Number(period.value) || 7);
    const startDate = new Date(`${start.value}T00:00:00`);
    if (Number.isNaN(startDate.getTime())) {
      error.write("Pick a start date.");
      return;
    }

    const out = [];
    let date = startDate;
    for (let i = 0; i < count; i++) {
      const seasonal = amp * Math.sin((2 * Math.PI * i) / wave);
      const drift = slope * i;
      const jitter = spread ? gaussian(random, 0, spread) : 0;
      out.push({ date: iso(date, frequency.value), value: Number((Number(base.value || 0) + drift + seasonal + jitter).toFixed(2)) });
      date = step(date, frequency.value);
    }

    if (spikeDate.value && Number(spikeMultiplier.value)) {
      const target = spikeDate.value;
      const hit = out.find((point) => point.date.startsWith(target));
      if (hit) hit.value = Number((hit.value * Number(spikeMultiplier.value)).toFixed(2));
      else error.write("The spike date is outside the series, so it was skipped.");
    }

    series = out;
    render();
  }

  function render() {
    if (!series.length) {
      summary.textContent = "";
      chart.replaceChildren();
      result.textContent = "";
      return;
    }
    const values = series.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const width = 100;
    const height = 34;

    // One polyline, drawn in a fixed viewBox, so the preview scales without a
    // chart library.
    const points = series
      .map((point, index) => {
        const x = (index / Math.max(1, series.length - 1)) * width;
        const y = height - ((point.value - min) / span) * height;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("class", "h-40 w-full");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", `Series preview, ${series.length} points`);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    line.setAttribute("points", points);
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", "var(--jade)");
    line.setAttribute("stroke-width", "0.7");
    line.setAttribute("vector-effect", "non-scaling-stroke");
    svg.append(line);

    chart.replaceChildren(
      svg,
      el("div", { class: "flex justify-between text-2xs text-ink-3 tabular-nums" },
        el("span", {}, series[0].date),
        el("span", {}, `${min} to ${max}`),
        el("span", {}, series[series.length - 1].date))
    );

    const preview = [["date", "value"], ...series.slice(0, 40).map((point) => [point.date, String(point.value)])];
    result.textContent = toCsv(preview) + (series.length > 40 ? `\n… ${series.length - 40} more rows` : "");
    summary.textContent = `${series.length} points · ${frequency.value} · ${min} to ${max} · seed ${seed.value || "mevebu"}`;
  }

  for (const node of [start, frequency, length, base, trend, season, period, noise, seed, spikeDate, spikeMultiplier]) {
    node.addEventListener("input", build);
    node.addEventListener("change", build);
  }

  const downloadButton = button("Download CSV", {
    icon: "download",
    kind: "fill",
    onclick: () => {
      if (!series.length) return;
      download("series.csv", toCsv([["date", "value"], ...series.map((point) => [point.date, String(point.value)])]), "text/csv");
      toast("Series ready");
    },
  });

  build();

  const shell = toolcard({
    body: bench(
      stack(
        el("div", { class: "grid grid-cols-2 gap-3" }, panel("Start", start), panel("Frequency", frequency)),
        panel("Points", length),
        el("div", { class: "grid grid-cols-2 gap-3" }, panel("Base", base), panel("Trend per point", trend)),
        el("div", { class: "grid grid-cols-2 gap-3" }, panel("Season amplitude", season), panel("Season period", period)),
        panel("Noise", noise),
        panel("Seed", seed),
        el("div", { class: "grid grid-cols-2 gap-3" }, panel("Spike date", spikeDate), panel("Spike ×", spikeMultiplier)),
        error
      ),
      stack(summary, chart, result)
    ),
    foot: actions(downloadButton),
  });

  slot.append(shell.node);

  return {};
}

export default { mount };
