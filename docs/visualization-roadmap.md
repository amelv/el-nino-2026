# El Niño visual roadmap

## Product direction

Make the site visual first and text second.

The homepage should answer three questions quickly:

1. What is happening now?
2. Where might people notice it?
3. What should I explore next?

Use short labels, maps, timelines, colors, and tooltips. Put detailed explanations and source notes behind links or expandable panels.

Use `El Niño` and `La Niña` in all public copy. Keep data keys such as `nino34` unchanged where they are part of a source format or code interface.

## Information architecture

### Overview

The visual homepage:

- One large status indicator: `El Niño advisory`
- One short sentence: `The tropical Pacific is much warmer than average.`
- A simple Pacific-to-world impact map
- A three-step timeline: `Now`, `Next season`, `Later`
- Four links: `Explore impacts`, `See the outlook`, `Compare past events`, `View sources`

Do not put the full glossary, data table, long disclaimer, or 12-month chart here.

### Impacts map

An interactive world map with a small number of broad regions. Each region shows:

- Typical signal: `warmer`, `cooler`, `wetter`, or `drier`
- Confidence: `common`, `mixed`, or `limited evidence`
- Season: `Dec-Feb`, `Mar-May`, etc.
- A one-sentence explanation
- Links to the underlying source

This should be presented as a pattern or tendency, never as a guaranteed forecast.

### Outlook

- Forecast probability by season
- A simple time strip covering the next 12 months
- Current ONI trend
- Forecast issue date and source
- Clear distinction between observed conditions and forecast conditions

### Local weather

Show local forecasts separately from El Niño impacts. A local forecast is not an El Niño forecast.

Possible flow:

- Pick a major city
- Show the next 7 days from an official weather service
- Show a separate seasonal El Niño tendency card
- Label the two data sources differently

The product should be global. Weather.gov can support U.S. locations, but it must be one provider among many, not the default for the whole site. Add a provider and source record for each country or region we support.

### Location explorer

Add a search box where someone can enter a city, ZIP code, or location name. The result should bring together three different kinds of information without blending them:

- **Local forecast:** the next 7 days from an official weather service
- **El Niño context:** the typical seasonal pattern for that broad region
- **Local history:** past temperature or rainfall patterns during comparable El Niño events

Use clear labels such as `Your local forecast`, `Typical El Niño pattern`, and `Past events`. The page should never imply that El Niño caused a particular day's weather.

**Possible flow:**

1. Search for a location.
2. Confirm the selected place and country.
3. Show the current local forecast.
4. Show a simple seasonal El Niño context card.
5. Offer a historical comparison for selected past events.
6. Link to the official local weather service and the underlying climate data.

**Location data model:**

```json
{
  "locationId": "miami-fl-us",
  "name": "Miami",
  "region": "southeastern-us",
  "country": "US",
  "latitude": 25.76,
  "longitude": -80.19,
  "forecastProvider": "NWS",
  "climateProvider": "NOAA climate data"
}
```

For Brazil, a future record might use an official Brazilian weather or climate source rather than the NWS. The location model should support country-specific providers, local languages, metric units, time zones, and different forecast formats.

**Historical context data model:**

```json
{
  "locationId": "miami-fl-us",
  "eventId": "1997-98",
  "season": "Dec-Feb",
  "variable": "precipitation",
  "value": 1.18,
  "unit": "relative-to-average",
  "sampleSize": 8,
  "dataType": "historical-observation",
  "source": "NOAA climate dataset"
}
```

For historical data, prefer a comparison such as `wetter than average` or `near average` over false precision. Show the number of comparable events used. If the sample is small or mixed, say so.

**Global MVP version:** Start with a curated set of major cities across several climate regions and continents instead of open-ended global geocoding. A useful first set could include:

- Brazil: São Paulo, Rio de Janeiro, Brasília, Manaus
- Southern South America: Buenos Aires, Santiago
- North America: Miami, Mexico City, Los Angeles
- Africa: Nairobi, Lagos, Cape Town
- Asia and the western Pacific: Jakarta, Manila, Mumbai, Tokyo
- Australia and the Pacific: Sydney, Darwin, Auckland

This is a representative global slice, not a claim that these places are the only important locations. Expand coverage as each location has a reliable forecast source and a documented historical climate source.

For the first search experience, use a curated location index with country, coordinates, region, provider, and supported data types. Add open-ended geocoding only after source coverage is strong enough to give every result a useful answer.

### History

- Select a past El Niño
- Compare the event strength and duration
- Show regional observed patterns
- Include a source and a `what this does not prove` note

Do not imply that a past event predicts the current event one-to-one.

### Sources and methods

Keep this page factual and compact:

- Source name
- What it measures
- Update schedule
- What the data can and cannot say
- Retrieval date

## Visualization candidates and data models

### 1. Current status card

**Visual:** Large status label with a small temperature marker.

**Data model:**

```json
{
  "state": "el-nino",
  "label": "El Niño Advisory",
  "issued": "2026-08-13",
  "nextUpdate": "2026-09-10",
  "summary": "The tropical Pacific is much warmer than average.",
  "source": "NOAA CPC"
}
```

**Source:** NOAA CPC advisory. This is the first MVP visualization.

### 2. Pacific temperature strip

**Visual:** Four compact meters for Niño 1+2, Niño 3, Niño 3.4, and Niño 4.

**Data model:**

```json
{
  "region": "nino34",
  "label": "Niño 3.4",
  "period": "2026-07",
  "anomalyC": 2.03,
  "normalRange": [-0.5, 0.5],
  "source": "NOAA CPC"
}
```

**Source:** NOAA SSTOI. This is more useful than a table for the homepage.

### 3. El Niño impact map

**Visual:** Simplified world map with broad, clickable regional areas. Use a limited palette and text labels, not an unexplained heat map.

**Data model:**

```json
{
  "regionId": "indonesia-western-pacific",
  "label": "Indonesia and western Pacific",
  "season": "Jun-Nov",
  "signals": ["drier", "less storm activity"],
  "strength": "common",
  "confidence": "medium",
  "summary": "Rain and storm activity are often lower during El Niño.",
  "observedThisEvent": null,
  "source": "NOAA CPC composites"
}
```

**Important:** Separate `typicalPattern` from `observedThisEvent`. Never show a historical average as a live condition.

**Source options:** NOAA CPC seasonal composites, NOAA Climate.gov, IRI, and peer-reviewed climatology. This needs research before implementation.

### 4. Seasonal timeline

**Visual:** Horizontal 12-month strip with Northern and Southern Hemisphere seasons shown together.

**Data model:**

```json
{
  "month": "2026-09",
  "northernSeason": "fall",
  "southernSeason": "spring",
  "forecastState": "el-nino-likely",
  "probability": 100,
  "signals": ["Pacific warming continues"]
}
```

**Source:** IRI/CCSR forecast probabilities plus NOAA CPC outlooks.

**Caution:** A year-long timeline should show forecast confidence fading over time. It must not look like a deterministic animation or promise.

### 5. Major-city weather cards

**Visual:** Small cards with current conditions and a seven-day forecast. Keep these separate from the El Niño layer.

**Data model:**

```json
{
  "cityId": "miami-fl",
  "name": "Miami, FL",
  "lat": 25.76,
  "lon": -80.19,
  "forecastSource": "NWS",
  "forecastUpdated": "2026-08-15T10:00:00Z",
  "periods": []
}
```

**Source:** `api.weather.gov` for U.S. locations. Cache responses. Send a descriptive `User-Agent`. Do not call the API for every visitor without a cache.

### 6. Past-event comparison

**Visual:** Select an event such as 1982-83, 1997-98, 2015-16, or the current event. Compare a small number of measures.

**Data model:**

```json
{
  "eventId": "1997-98",
  "label": "1997-98 El Niño",
  "peakOni": 2.4,
  "startMonth": "1997-04",
  "endMonth": "1998-06",
  "regionalNotes": [],
  "sources": []
}
```

**Source:** NOAA CPC ONI history and NOAA historical analyses. Regional impact records need careful sourcing.

### 7. Climate news and resources

**Visual:** A small source list, not a live news map at first.

**Data model:**

```json
{
  "title": "NOAA updates El Niño discussion",
  "publisher": "NOAA CPC",
  "published": "2026-08-13",
  "url": "https://...",
  "type": "official-update",
  "summary": "One sentence written by the site editor."
}
```

Start with a curated list of official updates. A live climate-news map introduces moderation, licensing, geographic ambiguity, and misinformation risks.

## Recommended MVP

### MVP goal

Make the homepage useful in 30 seconds without requiring a paragraph of reading.

### MVP scope

1. Replace the homepage text blocks with a visual status layout.
2. Add four Pacific temperature meters using the existing NOAA data.
3. Add a simple, non-geographic impact diagram with 4-6 labeled regions.
4. Add a compact seasonal outlook strip using the existing forecast data.
5. Keep `/learn/`, `/outlook/`, `/regions/`, and `/data/` as supporting pages.
6. Add a `/sources/` page with the data-source table.
7. Use tooltips or short expandable labels for terms such as anomaly and ONI.
8. Keep every visualization usable without color alone. Include labels, icons, and text.

The location explorer should be a later MVP extension after the regional model is stable. Its first version can support a curated global city set, including Brazil, with forecast cards and carefully labeled historical context. Locations without reliable coverage should say so plainly instead of showing incomplete or generic data.

### MVP data work

1. Define a versioned `public/data/impacts.json` file for typical regional patterns.
2. Define a versioned `public/data/cities.json` file with the first 6-10 U.S. cities.
3. Extend `data.json` with normalized dates and human-readable labels while preserving existing source keys.
4. Add a `source`, `retrievedAt`, and `dataType` field to each new dataset.
5. Mark every record as one of: `observed`, `forecast`, `historical-average`, or `curated-resource`.
6. Document uncertainty and missing data instead of filling gaps with generic claims.

### MVP design rules

- One primary visual per screen.
- One idea per card.
- Short labels before explanatory text.
- No more than three major numbers on the homepage.
- Use color as a supplement, never the only signal.
- Use a legend for every map or chart.
- Show `observed`, `forecast`, and `typical` as visibly different states.
- Prefer a useful empty state over unsupported regional claims.
- Keep animations optional, brief, and respectful of `prefers-reduced-motion`.

## Later experiments

These are promising but should follow the MVP:

- Interactive seasonal impact map with hemisphere toggle
- City search and saved locations
- Global location search with local forecast, El Niño context, and historical comparisons
- Location search with local forecast, El Niño context, and historical comparisons
- Historical event slider
- Animated month-by-month map, with pause and reduced-motion support
- Curated climate news/resource map
- International city forecasts with official national weather services
- Downloadable data files and methodology notes

## Risks to resolve early

- A typical El Niño impact map can be mistaken for a local forecast.
- Live weather conditions and seasonal climate effects are different products.
- Global city forecasts need multiple national APIs and different licensing rules.
- News aggregation needs editorial review and link maintenance.
- “Blobs” on a map can suggest false precision. Use broad regions and explicit labels.
- A year-long animation can imply certainty. Make confidence and dates visible.
- Weather.gov data is excellent for U.S. forecasts but is not a global forecast source.

## Next implementation checkpoint

Before adding more pages or APIs, build one prototype screen containing:

- Current status card
- Four Niño-region meters
- One simple impact map or regional diagram
- One seasonal timeline
- Source and uncertainty labels

Test that screen on a phone and with a screen reader. If people can understand the current state without reading a long paragraph, use it as the visual language for the rest of the site.
