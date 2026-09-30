"""
CYCLOPS Real ML Training v2 (honest, train-serve matched).
- Mirrors main.py BlockchainMLEngine._compute_features exactly,
  including sweep cap 5.0, holding defaults (60.0 / 8.4), peel 0.0 for <2 outs.
- Includes live-like edge cases the old synth missed:
  fresh suspect (0 in, 1 out), single-tx mules, hodlers (0 out),
  zero-value CEX churn txs, linear peel chains.
- 30% hard-overlap cases so accuracy is honest, not separable-by-design.
- Saves full honest meta: per-class P/R/F1, confusion, balanced acc,
  data_source=synthetic, limitations, intended use.
Interface unchanged: models/cyclops_rf.pkl, models/cyclops_rf_meta.json,
models/demo_preds.json — backend loads without changes.
"""
import json
import pickle
import hashlib
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import (
    classification_report,
    accuracy_score,
    balanced_accuracy_score,
    confusion_matrix,
)

ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
OUT_MODEL = MODEL_DIR / "cyclops_rf.pkl"
OUT_META = MODEL_DIR / "cyclops_rf_meta.json"

SEED = 42
rng = np.random.default_rng(SEED)

SWEEP_CAP = 5.0  # must match main.py _compute_features cap

LABELS = ["CEX_HOT_WALLET", "MULE_INTERMEDIARY", "PERSONAL_RETAIL_WALLET"]
N_PER = 500  # 1500 total — bigger than v1 (1050) for stabler estimates
FEATURE_COLS = [
    "in_degree", "out_degree", "total_in", "total_out",
    "holding_time_mins", "peel_ratio", "sweep_ratio",
    "degree_total", "in_out_ratio",
]


def capped_sweep(total_in, total_out):
    return round(min(total_out / (total_in + 0.0001), SWEEP_CAP), 3)


def synth_row(label):
    r = rng.random
    # ---- CEX_HOT_WALLET: high degree churn, fast settle, sweep ~1 ----
    if label == "CEX_HOT_WALLET":
        if r() < 0.28:
            # hard overlap: small CEX sub-wallet / OTC desk that looks like a mule
            in_degree = int(rng.integers(2, 12))
            out_degree = int(rng.integers(2, 12))
            total_in = float(rng.uniform(2, 30))
        else:
            in_degree = int(rng.integers(10, 70))
            out_degree = int(rng.integers(10, 70))
            total_in = float(rng.uniform(20, 500))
        total_out = float(total_in * rng.uniform(0.85, 1.05))
        if r() < 0.10:
            # zero-value churn txs like live Binance hot wallet (many 0.0 txs)
            total_in = float(rng.uniform(0.5, 8))
            total_out = float(total_in * rng.uniform(0.8, 1.05))
        holding = float(rng.uniform(2, 600))
        peel = float(rng.uniform(0.05, 0.60))
        sweep = capped_sweep(total_in, total_out)
    # ---- MULE_INTERMEDIARY: pass-through, fast, high sweep/peel ----
    elif label == "MULE_INTERMEDIARY":
        u = r()
        if u < 0.15:
            # FRESH SUSPECT edge case (matches 0x9999 live _compute):
            # 0 in, 1-2 out, total_in 0, holding 60.0 default, peel 0.0
            in_degree, out_degree = 0, int(rng.integers(1, 3))
            total_in = 0.0
            total_out = float(rng.uniform(1, 12))
            holding = 60.0
            peel = 0.0 if out_degree < 2 else float(rng.uniform(0.70, 0.95))
            sweep = capped_sweep(total_in, total_out)  # -> 5.0
        elif u < 0.30:
            # linear 1-in-1-out chain mule (matches 0x7777/0x5555):
            in_degree, out_degree = 1, 1
            total_in = float(rng.uniform(0.5, 30))
            total_out = float(total_in * rng.uniform(0.85, 1.0))
            holding = 60.0 if r() < 0.5 else float(rng.uniform(5, 120))
            peel = 0.0
            sweep = capped_sweep(total_in, total_out)
        elif u < 0.40:
            # CEX-lookalike mule ring (hard case)
            in_degree = int(rng.integers(10, 25))
            out_degree = int(rng.integers(10, 25))
            total_in = float(rng.uniform(1, 30))
            total_out = float(total_in * rng.uniform(0.7, 1.0))
            holding = float(rng.uniform(5, 180))
            peel = float(rng.uniform(0.5, 0.95))
            sweep = capped_sweep(total_in, total_out)
        else:
            in_degree = int(rng.integers(1, 5))
            out_degree = int(rng.integers(1, 6))
            total_in = float(rng.uniform(0.5, 30))
            total_out = float(total_in * rng.uniform(0.6, 1.04))
            holding = float(rng.uniform(5, 180))
            if r() < 0.10:
                holding = 8.4  # out-before-in edge from _compute
            peel = float(rng.uniform(0.35, 0.96)) if out_degree >= 2 else 0.0
            if r() < 0.20 and out_degree >= 2:
                peel = float(rng.uniform(0.05, 0.40))
            sweep = capped_sweep(total_in, total_out)
    # ---- PERSONAL_RETAIL_WALLET: slow, hodl, low sweep ----
    else:
        u = r()
        if u < 0.10:
            # hodler: outs = 0
            in_degree = int(rng.integers(1, 8))
            out_degree = 0
            total_in = float(rng.uniform(0.3, 25))
            total_out = 0.0
            holding = float(rng.uniform(1000, 5000))
            peel = 0.0
            sweep = capped_sweep(total_in, total_out)  # -> 0.0
        elif u < 0.20:
            # busy retail that looks mule-ish (hard case)
            in_degree = int(rng.integers(8, 25))
            out_degree = int(rng.integers(8, 25))
            total_in = float(rng.uniform(0.5, 25))
            total_out = float(total_in * rng.uniform(0.3, 0.9))
            holding = float(rng.uniform(60, 800))
            peel = float(rng.uniform(0.3, 0.8)) if out_degree >= 2 else 0.0
            sweep = capped_sweep(total_in, total_out)
        else:
            in_degree = int(rng.integers(1, 10))
            out_degree = int(rng.integers(0, 9))
            total_in = float(rng.uniform(0.3, 25))
            total_out = float(total_in * rng.uniform(0.05, 0.7)) if out_degree else 0.0
            holding = float(rng.uniform(300, 5000))
            peel = float(rng.uniform(0.05, 0.55)) if out_degree >= 2 else 0.0
            sweep = capped_sweep(total_in, total_out)

    # small measurement noise so thresholds aren't razor-clean
    total_in = round(float(total_in * rng.uniform(0.95, 1.05)), 3)
    total_out = round(float(total_out * rng.uniform(0.95, 1.05)), 3)
    sweep = capped_sweep(max(total_in, 0.0), max(total_out, 0.0))
    degree_total = int(in_degree + out_degree)
    in_out_ratio = round((in_degree + 0.1) / (out_degree + 0.1), 3)
    return {
        "in_degree": int(in_degree),
        "out_degree": int(out_degree),
        "total_in": max(total_in, 0.0),
        "total_out": max(total_out, 0.0),
        "holding_time_mins": round(float(holding), 1),
        "peel_ratio": round(float(peel), 3),
        "sweep_ratio": sweep,
        "degree_total": degree_total,
        "in_out_ratio": in_out_ratio,
        "label": label,
    }


rows = [synth_row(lab) for lab in LABELS for _ in range(N_PER)]
df = pd.DataFrame(rows)
print(f"Dataset: {len(df)} rows, {df['label'].value_counts().to_dict()}")

X = df[FEATURE_COLS].values
label_to_int = {lab: i for i, lab in enumerate(sorted(LABELS))}
int_to_label = {v: k for k, v in label_to_int.items()}
y = np.array([label_to_int[v] for v in df["label"].values])

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=SEED, stratify=y
)

clf = RandomForestClassifier(
    n_estimators=150, max_depth=12, min_samples_leaf=2,
    random_state=SEED, n_jobs=-1,
)
clf.fit(X_train, y_train)

y_pred = clf.predict(X_test)
acc = accuracy_score(y_test, y_pred)
bal = balanced_accuracy_score(y_test, y_pred)
print(f"Accuracy: {acc:.4f}  balanced: {bal:.4f}")
print(classification_report(y_test, y_pred, target_names=sorted(LABELS)))
cm = confusion_matrix(y_test, y_pred)
print("Confusion:\n", cm)

cv = cross_val_score(
    clf, X, y, cv=StratifiedKFold(5, shuffle=True, random_state=SEED)
)
print(f"CV 5-fold: {cv.mean():.4f} +/- {cv.std():.4f}")

importances = clf.feature_importances_
for col, imp in sorted(zip(FEATURE_COLS, importances), key=lambda x: -x[1]):
    print(f"  {col}: {imp:.3f}")

# data hash for provenance
data_hash = hashlib.sha256(
    pd.util.hash_pandas_object(df, index=True).values.tobytes()
).hexdigest()[:16]

with open(OUT_MODEL, "wb") as f:
    pickle.dump(
        {"model": clf, "feature_cols": FEATURE_COLS,
         "label_to_int": label_to_int, "int_to_label": int_to_label},
        f,
    )

rep = classification_report(
    y_test, y_pred, target_names=sorted(LABELS), output_dict=True
)
meta = {
    "model_name": "RandomForestClassifier",
    "version": "v2-train-serve-matched",
    "n_estimators": 150,
    "max_depth": 12,
    "min_samples_leaf": 2,
    "random_state": SEED,
    "features": FEATURE_COLS,
    "labels": LABELS,
    "sweep_cap": SWEEP_CAP,
    "accuracy_test": round(float(acc), 4),
    "balanced_accuracy_test": round(float(bal), 4),
    "cv_mean": round(float(cv.mean()), 4),
    "cv_std": round(float(cv.std()), 4),
    "cv_folds": [round(float(v), 4) for v in cv],
    "per_class": {
        lab: {
            "precision": round(float(rep[lab]["precision"]), 4),
            "recall": round(float(rep[lab]["recall"]), 4),
            "f1": round(float(rep[lab]["f1-score"]), 4),
            "support": int(rep[lab]["support"]),
        }
        for lab in sorted(LABELS)
    },
    "confusion_matrix": cm.tolist(),
    "confusion_labels": sorted(LABELS),
    "n_samples": len(df),
    "n_per_class": N_PER,
    "test_size": 0.2,
    "data_source": "synthetic-behavioral-v2 (NOT real chain labels)",
    "synthetic": True,
    "seed": SEED,
    "data_hash": data_hash,
    "train_serve_note": (
        "Synth mirrors main.py _compute_features incl. sweep cap 5.0, "
        "holding defaults 60.0/8.4, peel 0.0 for <2 outs, "
        "plus 0-in fresh-suspect and 1-in-1-out chain edge cases."
    ),
    "limitations": (
        "Synthetic benchmark only — NOT real-world accuracy. "
        "Real CEX/mule/retail labels from chain needed for production claims. "
        "Use for demo triage, not evidence."
    ),
    "intended_use": "Hackathon demo triage ranking; investigator review authoritative.",
    "trained_at": str(pd.Timestamp.now()),
    "importances": {
        k: round(float(v), 4) for k, v in zip(FEATURE_COLS, importances)
    },
}
with open(OUT_META, "w") as f:
    json.dump(meta, f, indent=2)
print(f"Saved model to {OUT_MODEL}")
print(f"Meta to {OUT_META}")

# Honest demo preds: live-like vectors, NOT cherry-picked best test rows.
# Order of proba follows _ML_LABELS sorted order used by backend blob.
live_like = [
    ("CEX_HOT_WALLET typical",
     {"in_degree": 35, "out_degree": 30, "total_in": 210.0, "total_out": 205.0,
      "holding_time_mins": 120.0, "peel_ratio": 0.30, "sweep_ratio": 0.976,
      "degree_total": 65, "in_out_ratio": 1.162}),
    ("MULE fresh suspect like 0x9999 (0 in, 1 out)",
     {"in_degree": 0, "out_degree": 1, "total_in": 0.0, "total_out": 4.85,
      "holding_time_mins": 60.0, "peel_ratio": 0.0, "sweep_ratio": 5.0,
      "degree_total": 1, "in_out_ratio": 0.091}),
    ("MULE 1-in-1-out chain like 0x7777",
     {"in_degree": 1, "out_degree": 1, "total_in": 4.85, "total_out": 4.5,
      "holding_time_mins": 60.0, "peel_ratio": 0.0, "sweep_ratio": 0.928,
      "degree_total": 2, "in_out_ratio": 1.0}),
    ("PERSONAL hodler",
     {"in_degree": 3, "out_degree": 0, "total_in": 8.5, "total_out": 0.0,
      "holding_time_mins": 4000.0, "peel_ratio": 0.0, "sweep_ratio": 0.0,
      "degree_total": 3, "in_out_ratio": 3.1}),
]
demo = []
for name, feat in live_like:
    vec = np.array([[feat[c] for c in FEATURE_COLS]], dtype=float)
    proba = clf.predict_proba(vec)[0]
    order = list(clf.classes_)
    proba_by_label = {
        int_to_label[int(c)]: round(float(p), 3) for c, p in zip(order, proba)
    }
    pred = int_to_label[int(clf.predict(vec)[0])]
    demo.append({"case": name, "pred": pred, "proba_by_label": proba_by_label,
                 "features": feat})
with open(MODEL_DIR / "demo_preds.json", "w") as f:
    json.dump(demo, f, indent=2)
print("Demo preds saved (live-like vectors)")
for d in demo:
    print(f"  {d['case']}: {d['pred']} {d['proba_by_label']}")
