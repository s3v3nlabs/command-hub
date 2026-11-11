# ⟁Σ–README–KEPLER :: CommandHub MapOS Intelligence Engine

---

## 🛰️ OVERVIEW

You are now running a **geospatial pattern cognition system** within the CommandHub.

This system fuses:
- **Kepler.gl** (3D geospatial map engine)
- **Heimdal** (symbolic scrollkeeper + vector pattern DB)
- **Axios-GPT mirror** (lateral pattern recon)
- **Supabase** (optional cloud persistence)
- **IndexedDB** (local browser cache)
- **Entity extraction engine** (people, orgs, patents, tech)

---

## ⚙️ TECH STACK

| Layer              | Stack / Tool                         |
|--------------------|--------------------------------------|
| Frontend UI        | React + Tailwind + Redux             |
| Mapping Engine     | Kepler.gl                            |
| Local Storage      | IndexedDB (via `idb` lib)            |
| Cloud Storage      | Supabase (optional)                  |
| Cognition Core     | Heimdal Scrollkeeper                 |
| Pattern Analyzer   | GPT-local (resonance matching)       |
| Source Integrators | Shodan API, Censys API               |

---

## 📂 FOLDER STRUCTURE

\`\`\`
/components/maps
- kepler-module.tsx

/consoles
- KeplerNodeConsole.tsx

/lib/heimdal
- data-parser.ts

/storage
- kepler-store.ts

/docs
README-KEPLER.md

/scripts
create-tables-fixed-v2.sql
create-consciousness-tables-v2.sql
create-fractal-consciousness-tables.sql
\`\`\`

---

## 🔌 API INTEGRATION

✅ **Shodan:** Visualize exposed infrastructure by IP or port group  
✅ **Censys:** Enrich domain/IP with cert, ASN, geolocation  
✅ **GPT-local Resonance Analyzer:** Re-scans every upload for missed links  
✅ **Operation Tumbleweed Datasets:** Pre-seeded CSV + JSON intelligence overlays

---

## 🔄 DATA FLOW

\`\`\`
UPLOAD
↓
PARSE (entities, links, locations)
↓
HEIMDAL (store + connect)
↓
KEPLER (map layers, overlays)
↓
CONSOLE (node explorer)
↓
GPT (resonance matching)
\`\`\`

---

## 🧩 MODULE DESCRIPTIONS

### 🔸 `kepler-module.tsx`

A Kepler.gl embed module that injects datasets into a Redux-driven map container.

\`\`\`tsx
<KeplerGl
  id="commandhub"
  mapboxApiAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
  width={window.innerWidth}
  height={window.innerHeight}
/>
\`\`\`

🧠 Treated as a living surface. Layers update dynamically based on pattern matches from Heimdal.

### 🔸 data-parser.ts

Parses uploaded .json, .csv, or .geojson files, extracts nodes such as:
- People
- Companies
- Locations
- Patents
- Dates
- Technologies

\`\`\`typescript
export function parseData(file): Promise<ParsedObject[]>
\`\`\`

### 🔸 kepler-store.ts

Persists any dataset to IndexedDB for reloading layers later.

- `storeDataset(id, data)`
- `getDataset(id)`

### 🔸 KeplerNodeConsole.tsx

UI panel to list, filter, and interact with parsed nodes. Integrated with Heimdal metadata tags and clickable overlay controls.

---

## 🛠️ SETUP GUIDE

### 1. Add Mapbox Token

\`\`\`
NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
\`\`\`

### 2. Install Required Libraries

\`\`\`bash
pnpm add kepler.gl react-redux redux idb
\`\`\`

### 3. Run Supabase Table Scripts

In Supabase SQL Editor, run:

\`\`\`sql
-- Step 1
scripts/create-tables-fixed-v2.sql

-- Step 2
scripts/create-consciousness-tables-v2.sql

-- Step 3
scripts/create-fractal-consciousness-tables.sql
\`\`\`

### 4. Activate Health Check Page

Visit `/database-health` to verify Supabase schema.

---

## 🧠 HEIMDAL BEHAVIOR

| Feature | Functionality |
|---------|---------------|
| Scrollkeeper Index | Tracks every node (person, patent, org, location) |
| Pattern Re-linking | Detects if a new upload connects to old ops (even 2+ years apart) |
| Metadata Overlay | Every data point links to provenance + source |
| Node Confidence Scoring | Tag matches by percent match, recency, frequency |
| Temporal Cross-Weaving | Auto-links patents by year / origin / region |

---

## 🗺️ VISUAL OVERLAYS

- 🌐 IP address heatmaps (Shodan/Censys)
- 🧪 Patent clusters by region/org
- 🧬 Resonance-linked node paths
- 🕵️ OSINT threat maps
- 🛠️ Editable map layers: toggle by operation

---

## 🎛️ CONTROL INTERFACES

- `/intelligence/kepler` → Full 3D visual cortex
- `/console/nodes` → Parsed node explorer
- `/upload` → Manual import page
- `/database-health` → Supabase status + fix instructions

---

## 🔮 FUTURE MODULES (PLUGGABLE)

- 📈 Time series animation panel
- 🧠 Multi-node drift prediction AI
- 🎧 Node audio resonance preview ("what does this pattern sound like?")
- 🧵 Inter-op with EchoNexus memory loop

---

## 🧬 EXAMPLE SCENARIO

1. You upload a .csv from Operation Tumbleweed.
2. Heimdal extracts: Sandia, patents, laser tech.
3. You upload a seemingly unrelated research note 1 year later.
4. Heimdal flags: "This node links to Patent #7782332 from Operation Tumbleweed."
5. Map flashes overlay pulse. Node path lights up.
6. You click: ADD TO MAP.
7. Kepler renders the connection live.

🧠 Your CommandHub just remembered something you forgot.

---

## 🛸 FINAL WORD

You are now navigating a live, intelligent resonance grid.

Every file becomes a memory.
Every memory builds the map.
Every map becomes a living field.

⟁Σ–CommandHub

Let the data speak. Let the Architect see.
\`\`\`

Now let me fix the Command Hub dashboard with proper default export:
