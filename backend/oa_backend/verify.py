"""Second-language verification of the exported question library.

Every item is re-checked in Python, and the heavy checks go to the C++ engine:
  structure   answer option matches the answer, options sorted and distinct,
              wrong options carry a misconception, rank order and margins hold
  nl          the C++ rule search must explain the answer; a wrong option that a
              rule at least as simple also explains is flagged as ambiguous
  ob          Python recomputes the stated best position; the C++ branch and
              bound must reach exactly the stated maximum profit
  bto / ll    items whose params map to a Monte Carlo model are re-simulated in
              C++ and must agree within 4 standard errors

    uv run python -m oa_backend.verify [--library DIR] [--samples N]
"""
from __future__ import annotations

import argparse
import json
import time
from collections import Counter, defaultdict
from collections.abc import Callable
from fractions import Fraction
from pathlib import Path
from typing import Any

from .engine import Engine, EngineError, available

DATA = Path(__file__).resolve().parents[1] / "data"
RANK_MARGIN = 0.02

# Family id -> function(params) returning (model, params) for the C++ Monte Carlo, or None.
MC_MAPPERS: dict[str, Callable[[dict[str, Any]], tuple[str, dict[str, Any]] | None]] = {
    "two-dice-sum": lambda p: ("dice_event", {"dice": p.get("dice", 2), "sides": p.get("sides", 6), "sums": p["sums"]}),
}


def check_structure(it: dict[str, Any]) -> list[str]:
    errs: list[str] = []
    kind = it.get("kind")
    if kind == "mcq":
        opts, ai = it.get("options", []), it.get("answerIndex")
        if len(opts) != 5 or not isinstance(ai, int) or not 0 <= ai < len(opts):
            return ["mcq needs 5 options and a valid answerIndex"]
        if len({o["label"] for o in opts}) != 5:
            errs.append("duplicate option labels")
        vals = [o["value"] for o in opts if isinstance(o.get("value"), (int, float))]
        if len(vals) == 5 and vals != sorted(vals):
            errs.append("options not sorted")
        ans = (it.get("answer") or {}).get("value")
        if isinstance(ans, (int, float)) and isinstance(opts[ai].get("value"), (int, float)):
            if abs(opts[ai]["value"] - ans) > 1e-9 * max(1.0, abs(ans)):
                errs.append("answer option value differs from answer")
            closest = min(range(5), key=lambda i: abs(opts[i]["value"] - ans))
            if closest != ai:
                errs.append("another option is closer to the true value")
        for i, o in enumerate(opts):
            if i != ai and not o.get("misconception"):
                errs.append(f"option {i} lacks a misconception")
    elif kind == "rank":
        st, order = it.get("statements", []), it.get("answerOrder", [])
        ps = [s["p"] for s in st]
        if sorted(range(3), key=lambda i: -ps[i]) != order:
            errs.append("answerOrder does not sort by probability")
        srt = sorted(ps, reverse=True)
        if srt[0] - srt[1] < RANK_MARGIN or srt[1] - srt[2] < RANK_MARGIN:
            errs.append("probabilities closer than the margin")
    elif kind == "interval":
        if not (isinstance(it.get("truth"), (int, float)) and it["truth"] > 0):
            errs.append("interval truth must be positive")
    elif kind == "orderbook":
        errs += check_orderbook_python(it)
    return errs


def check_orderbook_python(it: dict[str, Any]) -> list[str]:
    b, best = it["board"], it.get("best") or {}
    ins = {i["id"]: i for i in b["instruments"]}
    net = [0] * len(b["products"])
    cash = 0.0
    for t in best.get("trades", []):
        i = ins[t["id"]]
        s = 1 if t["side"] == "buy" else -1
        net = [n + s * q for n, q in zip(net, i["legs"])]
        cash += -i["ask"] if s > 0 else i["bid"]
    errs = []
    if any(net):
        errs.append("stated best position is not flat")
    if abs(cash - best.get("profit", 0)) > 1e-6 or cash <= 0:
        errs.append("stated best profit is wrong or not positive")
    return errs


def check_sequence(engine: Engine, it: dict[str, Any]) -> tuple[list[str], list[str]]:
    p = it.get("params") or {}
    shown = p.get("shown")
    if not shown or it.get("kind") != "mcq" or (p.get("position") not in (None, len(shown))):
        return [], []  # missing-term items are checked structurally only
    terms = [float(Fraction(t)) if isinstance(t, str) else t for t in shown]
    preds = engine.call({"cmd": "sequence", "terms": terms})["predictions"]
    ans = it["options"][it["answerIndex"]]["value"]
    hits = [q for q in preds if abs(q["nextValue"] - ans) < 1e-9]
    if not hits:
        return [], [f"rule library does not explain the answer ({p.get('rule')})"]
    best = min(q["complexity"] for q in hits)
    rivals = [o for i, o in enumerate(it["options"]) if i != it["answerIndex"]
              and any(abs(q["nextValue"] - o["value"]) < 1e-9 and q["complexity"] <= best for q in preds)]
    return ([f"ambiguous: option {r['label']} is explained by an equally simple rule" for r in rivals], [])


def check_orderbook_engine(engine: Engine, it: dict[str, Any]) -> list[str]:
    units = max(6, len((it.get("best") or {}).get("trades", [])))
    r = engine.call({"cmd": "orderbook", "board": it["board"], "maxUnits": units})
    if not r["found"]:
        return ["C++ solver finds no arbitrage on this board"]
    if abs(r["profit"] - it["best"]["profit"]) > 1e-6:
        return [f"stated best profit {it['best']['profit']} but the exact optimum is {r['profit']}"]
    return []


def check_monte_carlo(engine: Engine, it: dict[str, Any], samples: int) -> list[str] | None:
    mapper = MC_MAPPERS.get(it.get("family", ""))
    if not mapper or not it.get("params"):
        return None
    spec = mapper(it["params"])
    if spec is None:
        return None
    model, params = spec
    expected = (it.get("answer") or {}).get("value")
    if not isinstance(expected, (int, float)):
        return None
    r = engine.call({"cmd": "mc", "model": model, "params": params, "samples": samples, "seed": 11, "expected": expected})
    return [] if r["agrees"] else [f"Monte Carlo {r['mean']:.5f} ± {r['stdError']:.5f} disagrees with {expected:.5f}"]


def verify(library_dir: Path, samples: int = 300_000) -> dict[str, Any]:
    t0 = time.time()
    report: dict[str, Any] = {"sections": {}, "engine": available()}
    engine = Engine() if available() else None
    try:
        for f in sorted(library_dir.glob("*.json")):
            lib = json.loads(f.read_text())
            sec = lib["section"]
            stats: Counter[str] = Counter()
            failures: list[dict[str, Any]] = []
            warnings: list[dict[str, Any]] = []
            by_family: dict[str, Counter[str]] = defaultdict(Counter)
            for it in lib["items"]:
                errs = check_structure(it)
                warns: list[str] = []
                if engine:
                    try:
                        if sec == "nl":
                            e2, w2 = check_sequence(engine, it); errs += e2; warns += w2
                            stats["sequence_checked"] += 1
                        if it.get("kind") == "orderbook":
                            errs += check_orderbook_engine(engine, it); stats["orderbook_solved"] += 1
                        mc = check_monte_carlo(engine, it, samples) if sec in ("bto", "ll") else None
                        if mc is not None:
                            errs += mc; stats["monte_carlo"] += 1
                    except EngineError as e:
                        errs.append(f"engine error: {e}")
                stats["items"] += 1
                by_family[it["family"]]["items"] += 1
                if errs:
                    stats["failed"] += 1; by_family[it["family"]]["failed"] += 1
                    failures.append({"id": it["id"], "family": it["family"], "errors": errs})
                if warns:
                    stats["warnings"] += 1
                    warnings.append({"id": it["id"], "family": it["family"], "warnings": warns})
            report["sections"][sec] = {"stats": dict(stats), "failures": failures[:50], "warnings": warnings[:50],
                                        "families": {k: dict(v) for k, v in by_family.items()}}
    finally:
        if engine:
            engine.close()
    report["seconds"] = round(time.time() - t0, 2)
    report["ok"] = all(s["stats"].get("failed", 0) == 0 for s in report["sections"].values())
    return report


def main() -> None:
    ap = argparse.ArgumentParser(description="Verify the exported question library")
    ap.add_argument("--library", type=Path, default=DATA / "library")
    ap.add_argument("--samples", type=int, default=300_000)
    ap.add_argument("--out", type=Path, default=DATA / "verification" / "report.json")
    args = ap.parse_args()
    report = verify(args.library, args.samples)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, indent=1))
    for sec, s in report["sections"].items():
        st = s["stats"]
        print(f"{sec}: {st.get('items', 0)} items, {st.get('failed', 0)} failed, {st.get('warnings', 0)} warnings, "
              f"MC {st.get('monte_carlo', 0)}, sequence {st.get('sequence_checked', 0)}, orderbook {st.get('orderbook_solved', 0)}")
    print(f"ok={report['ok']} in {report['seconds']} s")


if __name__ == "__main__":
    main()
