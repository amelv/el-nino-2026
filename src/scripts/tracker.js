const SEASONS = {
  DJF: "December through February",
  JFM: "January through March",
  FMA: "February through April",
  MAM: "March through May",
  AMJ: "April through June",
  MJJ: "May through July",
  JJA: "June through August",
  JAS: "July through September",
  ASO: "August through October",
  SON: "September through November",
  OND: "October through December",
  NDJ: "November through January",
};

const fmt = (value) =>
  `${value > 0 ? "+" : ""}${Number(value).toFixed(2)}\u00b0C`;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function plainProb(prob) {
  if (prob == null) return "about";
  if (prob >= 98) return "nearly certain";
  if (prob >= 90) return "very likely (better than 9 in 10)";
  if (prob >= 70) return "likely";
  if (prob >= 55) return "more likely than not";
  if (prob >= 40) return "about even";
  return "unlikely";
}

function labelMeaning(label) {
  const text = String(label || "").toLowerCase();
  if (text.includes("warning"))
    return "NOAA's strongest label. El Niño conditions are present and expected to continue.";
  if (text.includes("advisory"))
    return "El Niño conditions are present and likely to continue. This describes the ocean now, not a local weather forecast.";
  if (text.includes("watch"))
    return "El Niño may develop within the next few months, but is not present yet.";
    return "NOAA updates this label when the ocean state changes.";
}

function seasonToPlain(match) {
  const start = SEASONS[match[1]] || match[1];
  const year = match[2];
  if (match[3]) {
    const end = SEASONS[match[3]] || match[3];
    return `${start} ${year} through ${end} ${match[4]}`;
  }
  return `${start} ${year}`;
}

async function getJSON(path) {
  const res = await fetch(path, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${path} returned ${res.status}`);
  return res.json();
}

function initAccordions(root) {
  root.querySelectorAll("[data-accordion-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const expanded = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!expanded));
      const panel = document.getElementById(trigger.getAttribute("aria-controls"));
      if (panel) {
        panel.classList.toggle("is-open", !expanded);
        panel.hidden = expanded;
      }
      const indicator = trigger.querySelector("[data-accordion-indicator]");
      if (indicator) indicator.textContent = expanded ? "+" : "\u2212";
    });
  });
}

function renderStatus(data) {
  const box = document.getElementById("statusBox");
  const label = document.getElementById("statusLabel");
  const meaning = document.getElementById("statusMeaning");
  const when = document.getElementById("statusWhen");
  if (!box || !label || !meaning || !when) return;
  const status = data.status || {};
  const labelText = status.label || "Status not available";

  label.textContent = labelText;
  meaning.textContent = labelMeaning(labelText);
  when.textContent = [
    status.issued ? `Data issued ${status.issued}` : "",
    status.next ? `Next update expected ${status.next}` : "",
  ]
    .filter(Boolean)
    .join("  |  ");

  const text = String(labelText).toLowerCase();
  if (text.includes("warning")) box.classList.add("alert--error");
  else if (text.includes("advisory")) box.classList.add("alert--info");
  else if (text.includes("watch")) box.classList.add("alert--warn");
  else box.classList.add("alert--info");
}

function renderSummary(data) {
  const list = document.getElementById("summaryList");
  if (!list) return;
  const forecast = data.forecast || {};
  const monthly = data.indices?.monthly;
  const latest = data.oni?.latest;
  const cards = [];
  if (monthly) cards.push([fmt(monthly.nino34), "Niño 3.4 ocean temperature", "Compared with average"]);
  if (latest) cards.push([fmt(latest.anomaly), "Latest ONI", `${latest.season} three-month average`]);
  if (forecast.prob != null) cards.push([`${forecast.prob}%`, "Chance El Niño continues", plainProb(forecast.prob)]);

  list.replaceChildren(
    ...cards.map(([value, label, note]) => {
      const card = el("div", "border border-gray-20 p-4");
      card.append(el("strong", "block font-mono text-xl text-primary-darker", value));
      card.append(el("span", "mt-1 block text-sm font-bold", label));
      card.append(el("span", "mt-1 block text-2xs text-muted", note));
      return card;
    })
  );
}

function renderIndices(data) {
  const body = document.getElementById("indicesBody");
  if (!body || !data.indices?.monthly) return;
  const m = data.indices.monthly;
  const rows = [
    ["Niño 1+2", m.nino12, "Far eastern Pacific, closest to South America"],
    ["Niño 3", m.nino3, "Eastern Pacific, near the equator"],
    ["Niño 3.4", m.nino34, "Central Pacific. The main tracking area"],
    ["Niño 4", m.nino4, "Western central Pacific"],
  ];
  body.replaceChildren(
    ...rows.map(([name, value, what]) => {
      const tr = el("tr");
      tr.append(
        el("td", "font-bold", name),
        el("td", `num ${value > 0.5 ? "text-warm-deep" : ""}`, fmt(value)),
        el("td", null, what)
      );
      return tr;
    })
  );
}

function renderOni(data) {
  const chart = document.getElementById("oniChart");
  if (!chart || !data.oni?.history?.length) return;
  const history = data.oni.history;
  const values = history.map((h) => h.anomaly);

  const min = Math.floor(Math.min(-0.5, ...values) * 10) / 10 - 0.1;
  const max = Math.ceil(Math.max(0.5, ...values) * 10) / 10 + 0.1;
  const range = max - min;
  const pct = (v) => ((v - min) / range) * 100;

  const rows = document.createElement("div");

  history.forEach((row) => {
    const value = row.anomaly;
    const color =
      value >= 0.5 ? "var(--color-warm-deep)" : value > 0 ? "var(--color-warm)" : "var(--color-blue-40)";
    const left = pct(Math.min(0, value));
    const width = Math.max(2, pct(value) - pct(0));

    const r = el("div", "oni-chart__row");
    const track = el("div", "oni-chart__track");
    const bar = el("div", "oni-chart__bar");
    bar.style.left = `${left}%`;
    bar.style.width = `${width}%`;
    bar.style.background = color;
    track.appendChild(bar);
    r.append(
      el("div", "oni-chart__season", row.season),
      track,
      el("div", "oni-chart__value", fmt(value))
    );
    rows.appendChild(r);
  });

  chart.innerHTML = "";
  chart.appendChild(rows);

  // threshold markers sit inside the first row's track for visual clarity
  const guides = document.querySelectorAll(".oni-chart__track");
  if (guides.length) {
    const first = guides[0];
    for (const [v, label] of [
      [0.5, "El Niño begins"],
      [-0.5, "La Niña begins"],
    ]) {
      const g = el("div", "oni-chart__guide oni-chart__guide--thresh");
      g.style.left = `${pct(v)}%`;
      g.setAttribute("title", label);
      first.appendChild(g);
    }
  }

  const trend =
    values[0] != null && values[values.length - 1] != null
      ? `The main index started 12 months ago at ${fmt(values[0])} and now sits at ${fmt(values[values.length - 1])}.`
      : "";
  chart.setAttribute(
    "role",
    "img"
  );
  chart.setAttribute(
    "aria-label",
    `Bar chart of the Oceanic Niño Index for the last 12 seasons, ending ${history[history.length - 1].season}. Higher means warmer. ${trend} The solid line marks where El Niño begins at +0.5 degrees.`
  );
}

function renderForecast(data) {
  const panel = document.getElementById("forecastBody");
  const note = document.getElementById("forecastNote");
  if (!panel) return;
  const forecast = data.forecast || {};

  if (!forecast.probText && forecast.prob == null) {
    panel.textContent = "Forecast data is not available right now.";
    return;
  }

  const seasonMatch =
    forecast.probText &&
    forecast.probText.match(
      /from\s+([A-Z]{3})\s+([0-9]{4})(?:\s+through\s+([A-Z]{3})\s+([0-9]{4}))?/
    );

  let sentence;
  if (seasonMatch) {
    const range = seasonToPlain(seasonMatch);
    if (forecast.prob != null) {
      sentence = `Forecasters put the chance of El Niño continuing at ${forecast.prob}% (${plainProb(forecast.prob)}) during ${range}.`;
    } else {
      sentence = `Forecasters expect El Niño to continue through ${range}.`;
    }
  } else if (forecast.prob != null) {
    sentence = `Forecasters put the chance of El Niño continuing at ${forecast.prob}% (${plainProb(forecast.prob)}).`;
  } else {
    sentence = forecast.probText;
  }

  panel.textContent = sentence;
  if (note)
    note.textContent =
      "Based on the IRI/CCSR outlook, which combines several forecast models. It usually updates once a month.";
}

function renderRegions(regions) {
  const list = document.getElementById("regionsList");
  if (!list) return;

  const note = document.getElementById("regionsNote");
  if (note && regions.note) note.textContent = regions.note;

  const items = (regions.regions || [])
    .filter((r) => r.status === "watch")
    .map((r) => {
      const item = el("div", "accordion__item");
      const id = `region-${(r.id || "region").replace(/[^a-zA-Z0-9]+/g, "-")}`;

      const trigger = el("button", "accordion__trigger");
      trigger.type = "button";
      trigger.setAttribute("data-accordion-trigger", "");
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-controls", id);
      const labelWrap = el("span", "");
      labelWrap.append(
        el("span", "tag tag--watch", "Watch"),
        el("strong", "ml-2", r.name)
      );
      const indicator = el("span", "accordion__indicator", "+");
      indicator.setAttribute("data-accordion-indicator", "");
      trigger.append(labelWrap, indicator);

      const panel = el("div", "accordion__panel");
      panel.id = id;
      panel.hidden = true;
      const p = el("p", "leading-relaxed");
      p.textContent = r.impact || "No note yet.";
      panel.appendChild(p);
      if (r.source) panel.appendChild(el("p", "mt-2 text-3xs text-muted", r.source));

      item.append(trigger, panel);
      return item;
    });

  const soon = (regions.regions || []).filter((r) => r.status !== "watch");
  if (soon.length) {
    const item = el("div", "accordion__item");
    const id = "region-coming-soon";
    const trigger = el("button", "accordion__trigger");
    trigger.type = "button";
    trigger.setAttribute("data-accordion-trigger", "");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", id);
    const labelWrap = el("span", "");
    labelWrap.append(
      el("span", "tag tag--soon", "Coming soon"),
      el("strong", "ml-2", `Other regions (${soon.length})`)
    );
    const indicator = el("span", "accordion__indicator", "+");
    indicator.setAttribute("data-accordion-indicator", "");
    trigger.append(labelWrap, indicator);

    const panel = el("div", "accordion__panel");
    panel.id = id;
    panel.hidden = true;
    const p = el("p", "leading-relaxed");
    p.textContent =
      "Detailed notes are not available for these regions yet. We only add information stated in the current NOAA advisory.";
    panel.appendChild(p);

    item.append(trigger, panel);
    items.push(item);
  }

  list.replaceChildren(...items);
  initAccordions(list);
}

function showError(err) {
  console.error(err);
  const box = document.getElementById("statusBox");
  if (box) box.classList.add("alert--error");
  const label = document.getElementById("statusLabel");
  if (label) label.textContent = "Data could not be loaded.";
  const meaning = document.getElementById("statusMeaning");
  if (meaning)
    meaning.textContent =
      "The data files were not reachable. Please try again later.";
}

export function initTracker() {
  initAccordions(document);
  const base = import.meta.env.BASE_URL;
  Promise.all([getJSON(`${base}data.json`), getJSON(`${base}data.regions.json` )])
    .then(([data, regions]) => {
      const when = document.getElementById("fetchedAt");
      if (when) when.textContent = data.fetchedAt ? `on ${data.fetchedAt}` : "recently";
      renderStatus(data);
      renderSummary(data);
      renderIndices(data);
      renderOni(data);
      renderForecast(data);
      renderRegions(regions);
    })
    .catch(showError);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTracker);
} else {
  initTracker();
}
