"""
Cyclops SIH26183 — Live Sample Ingester (Option B)
Fetches 20 real tx hashes per known VASP/mule and writes data/live_sample.json
with offline-verifiable provenance. Deterministic mock remains primary;
live_sample is merged at startup as an additional demo-verification layer.

Usage:
  python scripts/ingest_sample.py
  python scripts/ingest_sample.py --verify  # re-checks source_url returns 200

Requires: ETHERSCAN_API_KEY in .env or frontend/src/.env (fallback demo works without).
Rate: 5/sec Etherscan limit respected (0.25s sleep between calls).
"""
import os
import sys
import json
import time
import hashlib
from pathlib import Path
from datetime import datetime, timezone

# Load .env (backend or frontend)
try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv(Path(__file__).resolve().parents[1] / "frontend" / "src" / ".env")
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
except ImportError:
    pass

try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False
    import requests

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
DATA_FILE = DATA_DIR / "live_sample.json"
PROV_FILE = DATA_DIR / "sample_provenance.json"

ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY", "").strip() or "KKU3TJR548FWDZ45X96ECQJHECJ1WI9NJG"
# Known VASP / demo addresses to sample (covers all CHAIN_DATASETS + extra stream wallet)
TARGETS = [
    ("Binance Hot Wallet 14 (CEX)", "0x28c6c06298d514db089934071355e5743bf21d60", "ethereum", "Etherscan"),
    ("WazirX Hot Wallet (FIU-IND)", "0x89e51fa8ca5d6634fe37299696956272db152c92", "ethereum", "Etherscan"),
    ("CoinDCX Hot Wallet (FIU-IND)", "0x503828976d22510aad0201ac7ec88293211d23dc", "ethereum", "Etherscan"),
    ("Hospital Ransomware demo (mule fan-out)", "0x1111a2b3c4d5e6f708192a3b4c5d6e7f8a9b0c1d", "ethereum", "Etherscan"),
    ("Binance BTC Storage (Blockstream)", "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo", "bitcoin", "Blockstream"),
]

def fetch_eth_txs(address: str, api_key: str, limit: int = 20):
    if not api_key:
        return [], "no-key"
    url = "https://api.etherscan.io/v2/api"
    # Try txlist first (native ETH), then tokentx (ERC-20) — covers hot wallets that mostly move tokens
    for action in ("txlist", "tokentx"):
        params = {
            "chainid": 1, "module": "account", "action": action, "address": address,
            "startblock": 0, "endblock": 99999999, "page": 1, "offset": limit,
            "sort": "desc", "apikey": api_key
        }
        try:
            if HAS_HTTPX:
                import httpx as hx
                r = hx.get(url, params=params, timeout=8.0)
                j = r.json()
            else:
                import requests as rq
                r = rq.get(url, params=params, timeout=8)
                j = r.json()
            if j.get("status") == "1" and isinstance(j.get("result"), list) and j["result"]:
                return j["result"][:limit], f"LIVE_ETHERSCAN_{action}"
        except Exception as e:
            continue
    # If both fail, return empty with last status (V2)
    try:
        if HAS_HTTPX:
            import httpx as hx
            r = hx.get("https://api.etherscan.io/v2/api", params={"chainid":1,"module":"account","action":"txlist","address":address,"apikey":api_key}, timeout=5.0)
            j = r.json()
            return [], f"etherscan-status-{j.get('status')}-{j.get('message','')}"
        else:
            import requests as rq
            r = rq.get("https://api.etherscan.io/v2/api", params={"chainid":1,"module":"account","action":"txlist","address":address,"apikey":api_key}, timeout=5)
            j = r.json()
            return [], f"etherscan-status-{j.get('status')}"
    except Exception as e:
        return [], f"error:{e}"

def fetch_btc_txs(address: str, limit: int = 20):
    url = f"https://blockstream.info/api/address/{address}/txs"
    try:
        if HAS_HTTPX:
            import httpx as hx
            r = hx.get(url, timeout=8.0)
            j = r.json() if r.status_code == 200 else []
        else:
            import requests as rq
            r = rq.get(url, timeout=8)
            j = r.json() if r.status_code == 200 else []
        return j[:limit], "LIVE_BLOCKSTREAM" if j else "empty"
    except Exception as e:
        return [], f"error:{e}"

def main(verify: bool = False):
    DATA_DIR.mkdir(exist_ok=True)
    ingested = []
    provenance = []
    now = datetime.now(timezone.utc).isoformat()

    for label, addr, chain, source in TARGETS:
        print(f"[ingest] {label} {addr} ({chain}) ...", flush=True)
        txs, src = [], source
        if chain == "ethereum":
            raw, src = fetch_eth_txs(addr, ETHERSCAN_API_KEY, 20)
            for tx in raw:
                try:
                    # Normalize to our MOCK shape for direct merge
                    val_eth = float(tx.get("value", 0)) / 1e18
                    ingested.append({
                        "hash": tx.get("hash"),
                        "from": (tx.get("from") or "").lower(),
                        "to": (tx.get("to") or "").lower() if tx.get("to") else "",
                        "value_eth": round(val_eth, 6),
                        "token": "ETH",
                        "timestamp": int(tx.get("timeStamp", 0)),
                        "source": src,
                        "vasp_label": label,
                        "provenance_url": f"https://etherscan.io/tx/{tx.get('hash')}",
                    })
                    provenance.append({
                        "tx_hash": tx.get("hash"),
                        "blockNumber": tx.get("blockNumber"),
                        "from": tx.get("from"),
                        "to": tx.get("to"),
                        "value_eth": val_eth,
                        "vasp": label,
                        "address": addr,
                        "source": src,
                        "source_url": f"https://etherscan.io/tx/{tx.get('hash')}",
                        "verified_at": now,
                        "chain": chain,
                    })
                except Exception as e:
                    print(f"  parse err {e}")
        elif chain == "bitcoin":
            raw, src = fetch_btc_txs(addr, 20)
            for tx in raw[:5]:  # keep 5 for brevity
                try:
                    txid = tx.get("txid")
                    ingested.append({
                        "hash": txid,
                        "from": addr,  # simplified
                        "to": addr,
                        "value_eth": 0.0,
                        "token": "BTC",
                        "timestamp": tx.get("status", {}).get("block_time", 0),
                        "source": src,
                        "vasp_label": label,
                        "provenance_url": f"https://blockstream.info/tx/{txid}",
                    })
                    provenance.append({
                        "tx_hash": txid,
                        "vasp": label,
                        "address": addr,
                        "source": src,
                        "source_url": f"https://blockstream.info/tx/{txid}",
                        "verified_at": now,
                        "chain": chain,
                    })
                except Exception as e:
                    print(f"  btc parse err {e}")
        # Respect 5/sec Etherscan limit
        time.sleep(0.3)
        print(f"  -> {len(ingested)} total so far, last src={src}")

    # Fallback: if Etherscan gave 0 (no key/rate-limit), write deterministic mock-derived provenance so judges still see file
    if not ingested:
        print("[ingest] No live txs fetched — writing deterministic mock provenance for demo")
        provenance = [
            {
                "tx_hash": "0xaaa1111111111111111111111111111111111111111111111111111111111111",
                "vasp": "Binance Hot Wallet 14 (CEX)",
                "address": "0x28c6c06298d514db089934071355e5743bf21d60",
                "source": "DEMO_MOCK_DATA",
                "source_url": "https://etherscan.io/tx/0xaaa1111111111111111111111111111111111111111111111111111111111111",
                "verified_at": now,
                "chain": "ethereum",
                "note": "Fallback mock — live Etherscan returned empty; mock prioritized per main.py:862"
            }
        ]
        ingested = provenance

    # Write files
    out_live = {
        "generated_at": now,
        "generator": "scripts/ingest_sample.py (Option B)",
        "api": "Etherscan txlist + Blockstream Esplora",
        "note": "Thin live layer — mock remains primary per main.py:862 deterministic demo priority. Live_sample merged at startup if present.",
        "count": len(provenance),
        "provenance": provenance,
        "ingested_normalized": ingested[:30],
    }
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(out_live, f, indent=2, ensure_ascii=False)
    print(f"[ingest] Wrote {DATA_FILE} ({len(provenance)} provenance)")

    with open(PROV_FILE, "w", encoding="utf-8") as f:
        json.dump(provenance, f, indent=2, ensure_ascii=False)
    print(f"[ingest] Wrote {PROV_FILE}")

    # Optional verify: hit each source_url HEAD
    if verify:
        print("[verify] Checking source_url reachability (HEAD)...")
        for p in provenance[:5]:
            url = p.get("source_url", "")
            try:
                if HAS_HTTPX:
                    import httpx as hx
                    r = hx.head(url, timeout=6.0, follow_redirects=True)
                    print(f"  {url} -> {r.status_code}")
                else:
                    import requests as rq
                    r = rq.head(url, timeout=6, allow_redirects=True)
                    print(f"  {url} -> {r.status_code}")
            except Exception as e:
                print(f"  {url} -> err {e}")
    # Hash for tamper-evidence
    h = hashlib.sha256(json.dumps(provenance, sort_keys=True).encode()).hexdigest()[:16]
    print(f"[ingest] provenance sha256[:16]={h}")
    print("[ingest] Done. Restart backend to merge live_sample.json into tracer (auto-loaded at startup).")

if __name__ == "__main__":
    verify = "--verify" in sys.argv
    main(verify=verify)
