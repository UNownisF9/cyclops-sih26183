# PROJECT CYCLOPS — SIH26183

**Autonomous Blockchain Forensics Platform** for tracing stolen cryptocurrency across multiple chains, attributing it to known exchanges/mixers, scoring laundering risk, and generating a court-ready forensic dossier.

Built for **Smart India Hackathon problem statement SIH26183**.

> ⚠️ **Hackathon prototype.** Several pieces (VASP registry, "ML" classifier, legal notice text) are simplified demo implementations — see [Limitations](#limitations--disclaimer) before treating any output as real evidence or a real legal instrument.

---

## Overview

A victim reports a crypto scam. Investigators enter the suspect's wallet address, and Cyclops:

1. Walks the chain of outgoing transactions from that wallet (a breadth-first "fund flow trace"), hop by hop.
2. Checks every address it finds against a registry of known exchanges (CEXs), bridges, and mixers.
3. Flags suspicious money-laundering patterns (peel chains, mixer use, rapid pass-through mule wallets).
4. Runs a lightweight heuristic classifier over the wallet's transaction pattern (sweep ratio, holding time, peel-chain asymmetry) to label it as e.g. `MULE_INTERMEDIARY` or `CEX_HOT_WALLET`.
5. Renders the trace as an interactive graph and generates a downloadable PDF "forensic dossier," including a template Section 91 Cr.P.C. / BNSS 2023 legal notice to the destination exchange.

## Key Features

- **Multi-chain wallet tracing** — Ethereum (native ETH + ERC-20 via Etherscan), Tron (TRC-20 USDT via TronGrid), and Bitcoin (via the public Blockstream Esplora API, no key required).
- **Guaranteed demo mode** — if no API key is set or an address isn't found on-chain, the backend falls back to a built-in mock multi-hop wallet trail so the demo always works offline.
- **VASP / entity attribution registry** — a hardcoded lookup table of known exchange, bridge, and mixer addresses (Binance, CoinDCX, WazirX, Gate.io, Tornado Cash, Polygon Bridge, etc.) with FIU-IND registration status and compliance contact.
- **Risk & pattern analysis** — flags mixer usage, peel-chain structuring, and direct-to-exchange deposits, and produces an overall risk score/rating.
- **Heuristic ML classification** — a rules-based feature extractor (holding velocity, balance sweep ratio, peel-chain asymmetry, in/out ratio) that labels a wallet's likely role.
- **Interactive graph canvas** — a Cytoscape.js-powered fund-flow graph in the React frontend, with an inspector, custody trail, ML, and legal-notice tab per node.
- **PDF forensic dossier** — server-side PDF generation (ReportLab) containing the chain-of-custody table and a statutory notice, downloadable via `/api/report/pdf`.
- **Mock NCRP live queue** — a simulated feed of incoming National Cybercrime Reporting Portal cases, for the dashboard view.
- **Citizen & police portals** — the frontend includes separate flows for citizens (report a scam) and police/investigators (authenticate and run traces).

## Architecture

```
┌────────────────────────────┐         ┌──────────────────────────────┐
│   Frontend (React + Vite)  │  HTTP   │   Backend (FastAPI)           │
│   GraphViewer.jsx          │ ──────► │   main.py                      │
│   Cytoscape.js graph canvas│         │                                │
│   Citizen / Police portals │ ◄────── │   BlockchainTracer (BFS)       │
└────────────────────────────┘  JSON   │   BlockchainMLEngine (rules)   │
                                        │   analyze_trace_risk()         │
                                        │   generate_pdf() (ReportLab)   │
                                        └───────────┬────────────────────┘
                                                    │
                                   ┌────────────────┼────────────────────┐
                                   ▼                ▼                    ▼
                            Etherscan API     TronGrid API      Blockstream Esplora
                            (ETH / ERC-20)    (TRC-20 USDT)     (BTC, keyless)
                                   │                │                    │
                                   └──────── fallback to ────────────────┘
                                        MOCK_WALLET_TRAILS (built-in demo data)
```

**Backend flow (`/api/trace`):**
`suspect_address` → `BlockchainTracer.trace_fund_flow()` (BFS over outgoing transactions, up to `max_depth` hops and `max_branches` per node, stopping early at any recognized entity) → `analyze_trace_risk()` (pattern/risk scoring) → `BlockchainMLEngine.extract_features()` (heuristic classification) → combined JSON response consumed by the graph canvas.

## Tech Stack

**Backend**
- Python 3.11, [FastAPI](https://fastapi.tiangolo.com/) + Uvicorn
- Pydantic (request validation)
- `requests` (Etherscan / TronGrid / Blockstream calls)
- `reportlab` (PDF dossier generation)
- `python-dotenv` (loads `.env`)

**Frontend**
- React 19 + Vite
- [Cytoscape.js](https://js.cytoscape.org/) (graph rendering)
- Plain CSS (`index.css`, `App.css`) — no CSS framework

## Project Structure

```
.
├── main.py                  # FastAPI backend — tracer, risk engine, ML heuristic, PDF report
├── requirements.txt         # Backend Python dependencies
├── src/ (or project root)
│   ├── main.jsx             # React entry point
│   ├── App.jsx               # Root component → renders GraphViewer
│   ├── GraphViewer.jsx       # Main UI: graph canvas, portals, dashboard, dossier view
│   ├── App.css / index.css   # Styling
│   └── ...
├── index.html                # Vite HTML entry
├── package.json               # Frontend dependencies (React, Cytoscape, Vite)
└── vite.config.js             # Vite + React plugin config
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- (Optional) Etherscan and/or TronGrid API keys for **live** on-chain data — the app runs fully in demo mode without them.

### 1. Backend setup

```bash
# from the project root
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file next to `main.py` (optional — only needed for live chain data):

```env
ETHERSCAN_API_KEY=your_etherscan_key
TRONGRID_API_KEY=your_trongrid_key
```

Run the API:

```bash
uvicorn main:app --reload --port 8000
```

The API is now live at `http://localhost:8000`, with interactive docs at `http://localhost:8000/docs`.

### 2. Frontend setup

```bash
npm install
npm run dev
```

Vite will start the dev server (default `http://localhost:5173`).

> **Note:** `GraphViewer.jsx` points at `http://localhost:8000` when running on `localhost`, and otherwise falls back to a hardcoded deployed backend URL (`https://cyclops-sih26183.onrender.com`). Update the `API_BASE` constant near the top of `GraphViewer.jsx` if you deploy the backend elsewhere.

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Service info / health banner |
| `GET` | `/api/health` | Backend health, entity registry count, which chain backends are active |
| `GET` | `/api/ncrp/live-queue` | Mock live feed of incoming NCRP fraud cases (for the dashboard) |
| `POST` | `/api/trace` | Run a fund-flow trace on a suspect address. Body: `{ suspect_address, chain, max_depth, min_value_eth, max_branches }` |
| `POST` | `/api/ml/classify?address=...` | Run the heuristic ML classifier on a single address |
| `GET` | `/api/report/pdf?address=...` | Download a generated PDF forensic dossier for an address |

### Example: run a trace

```bash
curl -X POST http://localhost:8000/api/trace \
  -H "Content-Type: application/json" \
  -d '{
    "suspect_address": "0x9999a3b2e5f8841a0e889b41a91e1d092cb3e4a1",
    "chain": "ethereum",
    "max_depth": 3,
    "min_value_eth": 0.01,
    "max_branches": 5
  }'
```

This returns the graph (`elements.nodes` / `elements.edges`), any exchange/mixer `attributions`, the hop-by-hop `custody_trail`, a `risk_assessment`, and `ml_analysis`.

## How the Trace Works

1. Start from `suspect_address` at hop 0.
2. Fetch its outgoing transactions (live from the relevant chain API, or from `MOCK_WALLET_TRAILS` if no key/data is available).
3. For each destination address: if it matches a known entity in `KNOWN_ENTITIES` (exchange/mixer/bridge), record it as a terminal **attribution** and stop that branch. Otherwise, treat it as an intermediary/mule and keep tracing, up to `max_depth` hops.
4. Aggregate everything into a node/edge graph plus a linear custody trail, then score it for risk patterns (mixer use, peel-chaining, direct exchange deposit).

## Limitations & Disclaimer

- **Known-entity registry is hardcoded** — only a handful of demo addresses (Binance, CoinDCX, WazirX, Gate.io, Tornado Cash, Polygon Bridge) are recognized; anything else is labeled a generic "mule."
- **The "ML" classifier is a rules-based heuristic**, not a trained model — it thresholds a few hand-picked features (holding time, sweep ratio, peel-chain asymmetry) rather than learning from data.
- **Demo/mock data fallback** — without valid API keys (or for addresses the mock dataset doesn't cover), the app deterministically falls back to a small set of pre-built fake wallet trails so the UI always has something to show.
- **The PDF dossier and Section 91 Cr.P.C. / BNSS 2023 notice are illustrative templates** generated for the hackathon demo — they are not vetted legal instruments and shouldn't be sent to a real institution as-is.
- **The forensic report itself explicitly states** it does not independently establish criminal liability, wallet ownership, VASP attribution, intent, or legal guilt — blockchain evidence and investigator review remain authoritative.

## License

Not specified in the current codebase — add a license file if you intend to open-source this.
