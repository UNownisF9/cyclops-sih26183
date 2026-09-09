# PROJECT CYCLOPS — SIH26183

<p align="center">
  <img src="https://img.shields.io/badge/version-v6.2.0-blue?style=for-the-badge" alt="version" />
  <img src="https://img.shields.io/badge/SIH-26183-orange?style=for-the-badge" alt="SIH26183" />
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="python" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="react" />
  <img src="https://img.shields.io/badge/FastAPI-0.141-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="fastapi" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="license" />
</p>

<p align="center">
  <strong>Autonomous Blockchain Forensics Platform</strong> — trace stolen crypto across chains, attribute it to exchanges/mixers, score laundering risk, generate a court-ready forensic dossier.
  <br/>Built for <strong>Smart India Hackathon SIH26183</strong> by <strong>Team CrySec</strong>.
</p>

<p align="center">
  <a href="http://localhost:8000/docs"><strong>API Docs</strong></a> •
  <a href="#-quick-start-github">Quick Start</a> •
  <a href="#-patch-notes">Patch Notes</a> •
  <a href="#-security">Security</a>
</p>

> ⚠️ **Hackathon prototype.** VASP registry, “ML” classifier and Section 91 notice are simplified demo implementations — see [Limitations](#-limitations--disclaimer) before treating output as real evidence.

---

## ✨ What's New in v6.2.0

| Area | Before | After |
|---|---|---|
| **Citizen portal** | Static form + 5 hardcoded timeline rows | Dark live tracker: 6-stage lifecycle (FILED→…→RESOLVED), Golden Hour countdown, 3s polling via `GET /api/citizen/track/{docket}`, fund-hop preview, `enc:…` toggle |
| **Security** | `SHA256(salt+pass)` fast hash, `SHA256(secret)` key, no nonce | **PBKDF2-HMAC-SHA256 100k** key + old `SHA256` fallback for `enc:…` decrypt, **bcrypt** per-password salt (via `bcrypt`/`passlib`, `gensalt()` per officer) + `SHA256` fallback, CSP per-request `nonce-…` + `X-CSP-Nonce`/`X-Request-ID`, prod check for default secret |
| **Dossier / PDF** | `Unidentified Wallet (1 Hops)` empty on Bitcoin/Multi-chain/auto-trace | Deterministic mocks for `1A1z…`, `0x8888…` (+ `0x1111…`), `BRIDGE` transit → `CoinDCX (3 hops)` for **Deepak Chawla**, INR per token, deepest-`CEX` target — dossier & PDF now match for all chains |
| **Dataset (New)** | No live provenance, judges ask “mock or real?” | `scripts/ingest_sample.py` (Option B) — `Etherscan txlist+tokentx` + `Blockstream` (5/sec), writes `data/live_sample.json` (5 `LIVE_BLOCKSTREAM` BTC proven, `source_url` verifiable) + `data/sample_provenance.json`; `GET /api/dataset/live-sample` + `/sample-provenance`; `GET /api/health` shows `dataset.live_sample_count` |
| **Layout** | Topbar `Court Dossier` collided with `IST` at ~1480px; patch-notes button in 8 places | Topbar wraps at `1580/1480px`, `BRIDGE` handling, patch notes consolidated to **one** landing ledger card (`CHANGELOG · v6.2.0`) |

> Full history is also **in-app**: landing `Patch Notes — Complete & Concise` ledger card → modal with `v6.2.0`, `v6.0.0` expandable sections.

---

## 🏗 Architecture

```
┌────────────────────────────┐         ┌──────────────────────────────┐
│   Frontend (React + Vite)  │  HTTP   │   Backend (FastAPI)           │
│   GraphViewer.jsx          │ ──────► │   main.py                      │
│   Cytoscape.js canvas      │         │   BlockchainTracer (BFS)       │
│   Citizen / Police portals │ ◄────── │   BlockchainMLEngine (rules)   │
└────────────────────────────┘  JSON   │   analyze_trace_risk()         │
                                       │   generate_pdf() (ReportLab)   │
                                       └───────────┬────────────────────┘
                                                   │
                                  ┌────────────────┼────────────────────┐
                                  ▼                ▼                    ▼
                           Etherscan API     TronGrid API      Blockstream Esplora
                           (ETH / ERC-20)    (TRC-20 USDT)     (BTC, keyless)
                                  │                │                    │
                                  └──────── fallback to ────────────────┘
                                       MOCK_WALLET_TRAILS (deterministic demo)
```

**Backend flow `POST /api/trace`:** `suspect_address` → `BlockchainTracer.trace_fund_flow_async()` (BFS, `max_depth`/`max_branches`, stops on `CEX`/`MIXER`, `BRIDGE` transit) → `analyze_trace_risk()` → `BlockchainMLEngine.extract_features()` → JSON for graph canvas. `GET /api/dossier/data` and `GET /api/report/pdf` share the same tracer + `max(CEX by hop)` target.

---

## 🔑 Key Features

- **Multi-chain tracing** — Ethereum (ETH + ERC-20 via Etherscan), Tron (TRC-20 USDT via TronGrid), Bitcoin (Blockstream Esplora, keyless). Deterministic `MOCK_WALLET_TRAILS` for offline demos.
- **VASP registry** — 30 hardcoded CEX/bridge/mixer entries (Binance, CoinDCX, WazirX, Gate.io, Tornado, Polygon Bridge…) with FIU-IND status & compliance contact.
- **Risk & ML** — mixer/peel-chain/direct-deposit scoring + heuristic classifier (holding velocity, sweep ratio, peel asymmetry, in/out).
- **Graph canvas** — Cytoscape.js with hover highlight, tap pulse, animated dashed edges, inspector/custody/ML/Sec.91 tabs.
- **Dossier & PDF** — `SimpleDocTemplate` (ReportLab) chain-of-custody + Sec.91 notice, INR Indian grouping, `₹` glyph handling, provenance badge.
- **Portals** — Citizen (file + **live 6-stage tracking**, `enc:…` toggle, 3s poll `GET /api/citizen/track/{docket}`) and Police (auth, forensics, intelligence grid, court dossier).
- **Security** — AES-128 field encryption, hashed credentials, sanitization, rate-limit, security headers, CORS allowlist, audit log.

---

## 🧰 Tech Stack

**Backend** `Python 3.11` · `FastAPI` · `Uvicorn` · `Pydantic` · `requests`/`httpx` · `reportlab` · `cryptography` (Fernet) · `python-dotenv`  
**Frontend** `React 19` · `Vite 8` · `Cytoscape 3.34` · `framer-motion 11` · plain CSS (`index.css`, `App.css`)

---

## 📁 Project Structure

```
.
├── main.py                     # FastAPI backend — tracer, risk, ML, PDF, security, dossier
├── requirements.txt            # Backend deps (fastapi, uvicorn, reportlab, cryptography …)
├── ncrp_complaints.json        # Encrypted-at-rest citizen filings (gitignored, local only)
├── frontend/
│   ├── index.html              # Vite HTML entry + OG/Twitter/JSON-LD
│   ├── vite.config.js          # React plugin, manualChunks, no sourcemap
│   ├── package.json            # React, Cytoscape, Vite, framer-motion
│   └── src/
│       ├── main.jsx            # React entry
│       ├── App.jsx             # → GraphViewer
│       ├── GraphViewer.jsx     # All UI: landing, citizen, police, graph, dossier
│       ├── App.css             # Vite demo styles
│       └── index.css           # Full design system (paper/ink, topbar, ledger, workspace, dossier, patch-notes modal)
└── CYCLOPS_SIH26183_CrySec_Team_Report.docx
```

---

## 🚀 Quick Start (GitHub)

### Prerequisites

- **Python 3.11+** · **Node.js 18+ / npm** · **Git**
- (Optional) `ETHERSCAN_API_KEY` / `TRONGRID_API_KEY` for live on-chain data — demo works without them.

### 1. Clone

```bash
git clone https://github.com/UNownisF9/cyclops-sih26183.git
cd cyclops-sih26183
```

### 2. Backend

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create `.env` next to `main.py` (optional, for live chain data):

```env
ETHERSCAN_API_KEY=your_etherscan_key
TRONGRID_API_KEY=your_trongrid_key
# Optional overrides
CYCLOPS_AUTH_SECRET=change-in-prod
CYCLOPS_ENCRYPTION_KEY=44-char-urlsafe-base64-or-plain-secret
CYCLOPS_CORS_ORIGINS=https://your-frontend.vercel.app,https://your-backend.onrender.com
CYCLOPS_OFFICERS={"IO-CUSTOM-001":"custompass"}
```

Run:

```bash
uvicorn main:app --reload --port 8000
# → http://localhost:8000  docs at http://localhost:8000/docs
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

> `frontend/src/GraphViewer.jsx: API_BASE` — `http://localhost:8000` on `localhost`, else `https://cyclops-sih26183.onrender.com`. Change there if you deploy elsewhere.

### Default Police Credentials

| Badge | Passcode |
|---|---|
| `IO-I4C-9921` | `cybercell` |
| `admin` | `admin123` |
| `IO-MHA-001` | `cyclops2026` |
| `SIH-JUDGE` | `sih26183` |

Citizen portal needs no login — file a complaint to get a docket like `NCRP-2026-DEL-1092`, then use the `Enter NCRP docket` lookup on the same page (polls `GET /api/citizen/track/{docket}` every 3s).

---

## 🔌 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | — | Service banner + `v6.2.0` feature list |
| `GET` | `/api/health` | — | Health, `entities:30`, `security` flags, `citizen_tracking` |
| `GET` | `/api/security/status` | — | Field encryption algo, rate-limit, headers |
| `POST` | `/api/security/encrypt-demo` | — | `{"text":"…"}` → `enc:…` demo |
| `GET` | `/api/ncrp/live-queue` | — | Live-enriched queue (newest first, masked) |
| `POST` | `/api/ncrp/complaint` | — | File complaint → `docket_no` + `encryption` preview + `live_tracking` |
| `GET` | `/api/citizen/track/{docket_no}` | — | **Live** 6-stage timeline, `golden_hour_remaining`, `hops_preview` |
| `GET` | `/api/citizen/complaint/{docket_no}` | optional | Masked citizen view or decrypted `officer_view` if Bearer |
| `GET` | `/api/citizen/dockets?q=` | — | Search dockets |
| `POST` | `/api/auth/login` | — | `{"officer_id","passcode"}` → `Bearer` token (8h) |
| `GET` | `/api/auth/verify` | Bearer | Token check |
| `POST` | `/api/auth/logout` | Bearer | Revoke token |
| `GET` | `/api/audit/log` | Bearer | Last 50 audit events |
| `POST` | `/api/trace` | Bearer | `{"suspect_address","chain","max_depth","min_value_eth","max_branches"}` → graph + attributions + custody_trail |
| `POST` | `/api/ml/classify` | Bearer | `{"address":"…"}` → heuristic ML |
| `GET` | `/api/forensics/flow-metrics?address=` | Bearer | Time-series + VASP exposure |
| `GET` | `/api/dossier/data?address=` | optional | JSON dossier (used by Court Dossier tab) |
| `GET` | `/api/report/pdf?address=` | Bearer | Court PDF (ReportLab) |
| `GET` | `/api/report/pdf/preview?address=` | — | Watermarked demo PDF |
| `GET` | `/api/intelligence/summary` | optional | National grid stats + recent queue |
| `GET` | `/api/dataset/live-sample` | — | Live `data/live_sample.json` (Option B, `LIVE_BLOCKSTREAM`) |
| `GET` | `/api/dataset/sample-provenance` | — | 30-row `tx_hash`+`source_url` only |

**Example trace:**

```bash
curl -X POST http://localhost:8000/api/trace \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"suspect_address":"0x9999a3b2e5f8841a0e889b41a91e1d092cb3e4a1","chain":"ethereum","max_depth":3,"min_value_eth":0.01,"max_branches":5}'
```

---

## 🔍 How the Trace Works

1. Starts at `suspect_address` hop 0.
2. Calls `fetch_transactions_async()` — checks `MOCK_WALLET_TRAILS` first (deterministic demo), else live `Etherscan/TronGrid/Blockstream` (cached 5 min).
3. For each `to`: if `KNOWN_ENTITIES[addr]` is `CEX`/`MIXER` → terminal attribution + stop branch; if `BRIDGE` → log attribution but **continue** through bridge; else mule/intermediary, enqueue up to `max_depth`.
4. Builds `elements {nodes, edges}` + linear `custody_trail` (`value_inr` per token: `ETH:2.5L`, `BTC:52.57L`, `USDT:82`) → `analyze_trace_risk()` → `BlockchainMLEngine.extract_features()` → response.

---

## 🔒 Security — Demo-grade, judge-verifiable

- **Field encryption** — `encrypt_field()`/`decrypt_field()` (`cryptography.fernet.Fernet`, **PBKDF2-HMAC-SHA256 100k** + deterministic salt, fallback `SHA256` for old `enc:…` decrypt); `Fernet.generate_key()` from `CYCLOPS_ENCRYPTION_KEY` else `CYCLOPS_AUTH_SECRET`; stored as `enc:…`, masked via `mask_address()`/`mask_phone()`; citizen masked, LEA decrypts (`GET /api/citizen/complaint/{docket}` with Bearer).
- **Auth** — **bcrypt** per-password salt (`bcrypt.hashpw` + `gensalt()` per officer at startup, `HAS_BCRYPT` + `passlib` fallback) + **SHA256 fallback** for zero-downtime migration; `hmac.compare_digest` for SHA path; `Bearer` 8h token, `GET /api/audit/log` (200 events). See `main.py:360` `HAS_BCRYPT`.
- **Sanitization** — `sanitize_text()` strips `<tags>`/control chars, length caps, wallet regex.
- **Rate-limit** — `RateLimiter` sliding window: `60/min` global, `10/min` auth, `20/min` trace; `Retry-After`; `512KB` body guard (header check).
- **Headers & CORS** — `X-Content-Type-Options nosniff`, `X-Frame DENY`, **`CSP` with per-request `nonce-…` + `unsafe-inline` (Vite compat) + `X-CSP-Nonce`/`X-Request-ID`**, `HSTS 63072000`, `Referrer-Policy`, `Permissions-Policy`; `CORSMiddleware` allowlist via `CYCLOPS_CORS_ORIGINS`; prod warning if `CYCLOPS_AUTH_SECRET` is default.
- **Live dataset** — `data/live_sample.json` committed (5 `LIVE_BLOCKSTREAM` BTC `source_url` verifiable), `scripts/ingest_sample.py --verify` (Option B, 5/sec `Etherscan txlist+tokentx` + `Blockstream`), `GET /api/dataset/live-sample`.

---

## 📝 Patch Notes

Patch notes are **single-sourced** in-app: landing `CHANGELOG · v6.2.0` ledger card → modal (also via footer on landing — no longer in topbar/forensics/citizen/dossier/intel to avoid crowding).

- **v6.2.0 — Layout & Single-Source Notes (09 Sept 2026, Current/Fix)** — Topbar `Court Dossier`/`IST` overlap fixed (wrap at `1580/1480px`, compress at `1520–1481`), patch-notes consolidated to one ledger entry.
- **v6.1.0 — Secure & Live (09 Sept 2026, Major)** — Security hardening, citizen 6-stage live tracker (`GET /api/citizen/track`), dossier/PDF fix (now `Deepak Chawla → CoinDCX (3 hops)` correct for Multi-chain, plus `1A1z…` BTC & `0x1111…`), forensics `BRIDGE→CEX`.
- **v6.0.0 — CrySec (08 Sept 2026, Baseline)** — Multi-chain tracer, VASP registry, risk/ML, Cytoscape graph, dossier, NCRP queue. See in-app modal for full bullet list.

For the complete concise list, open the app landings ledger card or `Ctrl+K` → not needed — just the landing card.

---

## ☁️ Deployment

- **Backend** → Render/Fly/VM: `pip install -r requirements.txt` then `uvicorn main:app --host 0.0.0.0 --port $PORT`. Set `ETHERSCAN_API_KEY`, `TRONGRID_API_KEY`, `CYCLOPS_AUTH_SECRET`, `CYCLOPS_ENCRYPTION_KEY`, `CYCLOPS_CORS_ORIGINS`.
- **Frontend** → Vercel/Netlify: `cd frontend && npm install && npm run build` (`dist/`), env not required. Update `API_BASE` in `GraphViewer.jsx` if backend URL changes.
- Current `API_BASE` fallback: `https://cyclops-sih26183.onrender.com` (non-localhost).

---

## 🛠 Troubleshooting

| Issue | Fix |
|---|---|
| `410/429 Rate limit` | Wait `Retry-After` seconds; auth is `10/min`. |
| `401 Invalid token` | Re-login `POST /api/auth/login`; token is 8h. |
| Dossier shows `Unidentified Wallet` | Ensure backend is running with latest `MOCK_WALLET_TRAILS` (restart `uvicorn`); frontend auto-falls back to `activeDataset` after 3s poll. |
| `CORS` error | Add your frontend origin to `CYCLOPS_CORS_ORIGINS` comma list. |
| Port in use | `uvicorn main:app --port 8001` and change `API_BASE` to `:8001`. |
| `cryptography` missing | `pip install cryptography` — fallback XOR still works but Fernet is recommended. |

---

## ⚠️ Limitations & Disclaimer

- **VASP registry hardcoded** — only demo addresses (Binance, CoinDCX, WazirX, Gate, Tornado, Polygon Bridge) recognized; others → generic mule.
- **“ML” heuristic, not trained** — thresholds on holding velocity, sweep ratio, peel asymmetry.
- **Mock fallback** — without keys or for unknown addresses, deterministic fake trails are used so UI never white-screens.
- **PDF/Sec.91 notice are templates** — for hackathon demo, not vetted legal instruments. Report explicitly does not establish liability/ownership/intent — blockchain evidence + investigator review remain authoritative.

---

## 👥 Team CrySec — SIH26183

- **CYCLOPS** · Ministry of Home Affairs · Indian Cyber Crime Coordination Centre (I4C) · National Cybercrime Reporting Portal (NCRP) & SAHYOG Grid
- Built for the Golden Hour — file to freeze before the trail goes cold.

<p align="center">
  <a href="http://localhost:5173"><strong>Open Citizen Portal →</strong></a> •
  <a href="http://localhost:8000/docs"><strong>Open API Docs →</strong></a>
</p>
