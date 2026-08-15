#!/usr/bin/env python3
"""El Niño 2026 - fetch + parse NOAA/IRI data into src/data/data.json.

Run by GitHub Actions cron (daily). Also runnable locally.
Idempotent: writes src/data/data.json; the workflow only commits when content changes.
Manual override: if data.override.json exists in repo root, its keys merge over
auto-fetched values (for narrative text that's brittle to HTML-parse).
"""
import json, re, sys, datetime, urllib.request

BASE = "https://www.cpc.ncep.noaa.gov"
UA = {"User-Agent": "Mozilla/5.0 (ElNino2026Tracker/1.0)"}

def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")

def parse_oni(text):
    """SEAS YR TOTAL ANOM lines. Return latest + last 12."""
    rows = []
    for line in text.splitlines():
        parts = line.split()
        if len(parts) == 4:
            try:
                season = f"{parts[0]} {parts[1]}"
                anomaly = float(parts[3])
                rows.append({"season": season, "anomaly": anomaly})
            except ValueError:
                continue
    return {"latest": rows[-1] if rows else None, "history": rows[-12:]}

def parse_sstoi(text):
    """YR MON NINO1+2 ANOM NINO3 ANOM NINO4 ANOM NINO3.4 ANOM. Return latest row."""
    last = None
    for line in text.splitlines():
        parts = line.split()
        if len(parts) == 10:
            try:
                y, m = int(parts[0]), int(parts[1])
                nino12 = float(parts[3]); nino3 = float(parts[5])
                nino4 = float(parts[7]); nino34 = float(parts[9])
                last = {
                    "month": f"{y}-{m:02d}",
                    "nino12": nino12, "nino3": nino3,
                    "nino4": nino4, "nino34": nino34,
                }
            except ValueError:
                continue
    return last

def parse_advisory(text):
    """Status label + synopsis + issued/next dates from the diagnostic discussion HTML."""
    import html as html_mod
    def decode(s):
        return html_mod.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s or ""))).strip()
    status = None
    m = re.search(r"ENSO Alert System Status:\s*(.*?)</strong>", text, re.S | re.I)
    if m:
        status = decode(m.group(1))
    syn = None
    m = re.search(r"Synopsis:[^<]*(?:<[^>]+>[^<]*)*<strong>(.*?)</strong>", text, re.S | re.I)
    if m:
        syn = decode(m.group(1))[:400]
    issued = None
    nxt = None
    # Search on stripped text (tags removed) to avoid <br> in the middle.
    flat = re.sub(r"<[^>]+>", " ", text)
    flat = html_mod.unescape(re.sub(r"\s+", " ", flat))
    m = re.search(r"issued by\s*CLIMATE PREDICTION CENTER/NCEP/NWS\s*([0-9]+ [A-Za-z]+ [0-9]{4})", flat, re.I)
    if m:
        issued = m.group(1)
    m = re.search(r"The next ENSO Diagnostics Discussion is scheduled for\s*([0-9]+ [A-Za-z]+ [0-9]{4})", flat, re.I)
    if m:
        nxt = m.group(1)
    return {"label": status, "synopsis": syn, "issued": issued, "next": nxt}

def parse_iri(text):
    """IRI probabilities: 'probabilities are 100% from JAS 2026 through JFM 2027'."""
    m = re.search(r"probabilities are ([\d]+)%\s+from\s+(\S+)\s+through\s+(\S+)", text, re.I)
    if not m:
        m = re.search(r"El Ni[ñn]o probabilities are ([\d]+)%[^.]*?through\s+(\S+)", text, re.I)
    return {
        "probText": m.group(0) if m else None,
        "prob": int(m.group(1)) if m else None,
    } if m else {}

def main():
    out = {"fetchedAt": datetime.date.today().isoformat(), "sources": {}}
    failures = []

    # ONI
    try:
        out["oni"] = parse_oni(fetch(BASE + "/data/indices/oni.ascii.txt"))
        out["sources"]["oni"] = True
    except Exception as e:
        failures.append(f"oni: {e}"); out["sources"]["oni"] = False

    # Monthly indices (sstoi.indices = YR MON ... ; latest row = most recent month)
    try:
        out["indices"] = {"monthly": parse_sstoi(fetch(BASE + "/data/indices/sstoi.indices"))}
        out["sources"]["sstoi"] = True
    except Exception as e:
        failures.append(f"sstoi: {e}"); out["sources"]["sstoi"] = False

    # Advisory
    try:
        out["status"] = parse_advisory(fetch(BASE + "/products/analysis_monitoring/enso_advisory/ensodisc.shtml"))
        out["sources"]["advisory"] = True
    except Exception as e:
        failures.append(f"advisory: {e}"); out["sources"]["advisory"] = False

    # IRI forecast
    try:
        out["forecast"] = parse_iri(fetch("https://iri.columbia.edu/our-expertise/climate/forecasts/enso/current/"))
        out["sources"]["iri"] = True
    except Exception as e:
        failures.append(f"iri: {e}"); out["sources"]["iri"] = False

    # Manual override merge
    try:
        with open("data.override.json") as f:
            ov = json.load(f)
        for k, v in ov.items():
            if v is not None:
                if isinstance(v, dict) and isinstance(out.get(k), dict):
                    out[k].update(v)
                else:
                    out[k] = v
        out["sources"]["override"] = True
    except FileNotFoundError:
        pass
    except Exception as e:
        failures.append(f"override: {e}")

    out["errors"] = failures
    with open("src/data/data.json", "w") as f:
        json.dump(out, f, indent=2)
        f.write("\n")
    print(f"src/data/data.json written. failures: {failures or 'none'}")
    print(json.dumps({k: out.get(k) for k in ("status","forecast")}, indent=2)[:600])

if __name__ == "__main__":
    main()
