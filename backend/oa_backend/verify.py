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

# Family id -> function(params) returning (model, params[, transform]) for the C++ Monte
# Carlo, or None when that variant has no simulator (it is then checked structurally and
# by its own JS verifier only; the report counts coverage so gaps stay visible).
Mapper = Callable[[dict[str, Any]], "tuple[Any, ...] | None"]


def _p(frac: Any) -> float:
    return frac[0] / frac[1] if isinstance(frac, list) else float(frac)


def _at_least_one(p: dict[str, Any]):
    ps = p.get("ps") or []
    if p.get("variant") == "six" and ps and all(_p(x) == 1 / 6 for x in ps):
        return ("face_count", {"throws": len(ps), "face": 6, "k": 1})
    return None


def _first_success(p: dict[str, Any]):
    if p.get("variant") == "moreThanK":  # no success in the first k trials
        return ("binomial", {"n": p["k"], "p": p["a"] / p["c"], "k": 0, "cmp": "eq"})
    return None


def _derangements(p: dict[str, Any]):
    if p.get("kind") == "atLeastOne":
        return ("derangement", {"n": p["n"]}, lambda v: 1 - v)
    if p.get("kind") in ("none", "noFixed", "derangement"):
        return ("derangement", {"n": p["n"]})
    return None


def _urn(p: dict[str, Any]):
    if {"r", "b", "k", "j"} <= p.keys():
        return ("urn_count", {"counts": [p["r"], p["b"]], "draws": p["k"], "color": 0, "k": p["j"], "cmp": "ge" if p.get("atLeast") else "eq"})
    return None


def _duel(p: dict[str, Any]):
    a, b = p.get("A") or {}, p.get("B") or {}
    if a.get("type") == "die" and b.get("type") == "die" and not p.get("reroll"):
        return ("dice_duel", {"sides_a": a["k"], "sides_b": b["k"]})
    return None


MC_MAPPERS: dict[str, Mapper] = {
    "two-dice-sum": lambda p: ("dice_event", {"dice": p.get("dice", 2), "sides": p.get("sides", 6), "sums": p["sums"]}),
    "die-repeats": lambda p: ("faces_distinct", {"throws": p["n"], "sides": p["k"]}) if p.get("kind") == "allDiff" else
                             ("faces_distinct", {"throws": p["n"], "sides": p["k"], "same": True}) if p.get("kind") == "allSame" else None,
    "at-least-one": _at_least_one,
    "first-success": _first_success,
    "coin-sequences": lambda p: ("binomial", {"n": p["n"], "p": 0.5, "k": p["k"], "cmp": "eq"}) if p.get("kind") == "exactlyK" else None,
    "pattern-waiting": lambda p: ("pattern_wait", {"pattern": p["A"]}) if p.get("mode") == "wait" else None,
    "birthday": lambda p: ("birthday", {"people": p["n"], "days": p["d"]}) if p.get("mode") == "any" else None,
    "derangements": _derangements,
    "urn-draws": _urn,
    "dice-duel": _duel,
    "polygon-walk": lambda p: ("walk_cycle", {"n": p["n"], "start": 0, "target": 0}) if p.get("kind") == "return" else None,
    "gamblers-ruin": lambda p: ("gambler_ruin", {"start": p["i"], "target": p["N"]}) if p.get("mode") == "fairP" else None,
    "expected-extremes": lambda p: ("dice_extreme", {"dice": p["n"], "sides": p["s"], "min": bool(p.get("minOf"))}) if p.get("mode") == "dice" else None,
    "monty-hall": lambda p: ("monty", {"doors": p["n"], "opened": p["m"], "switch": p.get("variant") == "switch"}) if p.get("variant") in ("stay", "switch") else None,
    "uniform-geometry": lambda p: ("uniform_sum_le", {"n": 2, "s": p["s"]}) if p.get("kind") == "sum" else None,
    "running-sum": lambda p: ("running_sum_hit", {"target": p["n"]}) if p.get("mode") == "hit" and p.get("steps") == [1, 2, 3, 4, 5, 6] else None,
    "card-draws": lambda p: ("cards_same_suit", {"draws": 2}) if p.get("kind") == "sameSuit" else None,
    "card-symmetry": lambda p: ("top_card_after_discard", {"deck": 52, "red": 4, "discard": p["d"]}) if p.get("kind") == "discardAce" else None,
    "linearity": lambda p: ("pattern_count", {"flips": p["n"], "pattern": "HH"}) if p.get("kind") == "hh" else None,
    "bayes-test": lambda p: ("bayes_test", {"prev": _p(p["pv"]), "sens": _p(p["sv"]), "fpr": _p(p["fv"]), "negative": p.get("variant") == "neg"}) if p.get("variant") in ("pos", "neg") else None,
    "conditional-dice": lambda p: ("dice_conditional", {"sides": p.get("sides", 6), "cond": p["cond"][0], "sums": p["event"][1]})
                        if p.get("dice") == 2 and p.get("cond", [None])[0] == "different" and p.get("event", [None])[0] == "sumIn" else None,
    "clt-estimates": lambda p: ("binomial", {"n": p["n"], "p": 0.5, "k": p["lo"], "cmp": "ge"}) if p.get("kind") == "coinTail" and p.get("hi") == p.get("n") else None,
    "coupon-collector": lambda p: ("coupon", {"n": p["s"]}) if p.get("k") == p.get("s") else None,
}


def recompute_interval(it: dict[str, Any]) -> float | None:
    """Independent Python recomputation of an Intervals truth from params and the drawn visual."""
    import math
    from itertools import combinations
    from statistics import median
    p, v, fam = it.get("params") or {}, it["prompt"].get("visual") or {}, it["family"]
    sc = p.get("scenario")
    if fam == "dots-count" and sc == "grid-fill" and v.get("items"):
        return float(sum(1 for x in v["items"] if x.get("shape") == p["countShape"]))
    if fam == "dice-grid" and sc == "count-face":
        return float(sum(1 for x in p["pips"] if x == p["face"]))
    if fam == "path-length" and sc == "polyline":
        pts = p["points"]
        return sum(math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1)) / p["barPx"] * p["barUnits"]
    if fam == "percentile" and sc == "median":
        return float(median(p["values"]))
    if fam == "mental-product" and sc == "product2":
        out = 1.0
        for x in p["multiply"]:
            out *= x
        for x in p.get("divide", []):
            out /= x
        return out
    if fam == "powers-roots" and sc == "pow2":
        return float(2 ** p["k"])
    if fam == "combinatorics" and sc == "grid":
        return float(math.comb(p["a"] + p["b"], p["a"]))
    if fam == "fermi" and sc == "orders":
        return float(p["traders"] * p["perHour"] * p["hours"])
    if fam == "series" and sc == "linear" and isinstance(v.get("target"), (int, float, dict)):
        t = v["target"]["t"] if isinstance(v["target"], dict) else v["target"]
        return p["model"]["a"] + p["model"]["b"] * t
    if fam == "expected-dice" and sc == "sumN":
        return p["n"] * (p["m"] + 1) / 2
    if fam == "prob-exact" and sc == "sumEq":
        return 100 * sum(1 for a in range(1, 7) for b in range(1, 7) if a + b == p["s"]) / 36
    if fam == "prob-estimate" and sc == "sixes":
        return 100 * (1 - (5 / 6) ** p["n"])
    if fam == "coupon" and p.get("probs"):
        probs = [a / b for a, b in p["probs"]]
        n = len(probs)
        if n > 14:
            return None
        # E[T] = sum over non-empty subsets S of (-1)^(|S|+1) / sum_{i in S} p_i
        return sum((-1) ** (k + 1) / sum(c) for k in range(1, n + 1) for c in combinations(probs, k))
    return None


def check_structure(it: dict[str, Any]) -> list[str]:
    errs: list[str] = []
    kind = it.get("kind")
    if kind == "mcq":
        opts, ai = it.get("options", []), it.get("answerIndex")
        n = it.get("optionCount", 5)  # the 80-in-8 has 4 options; every other mcq section 5
        if len(opts) != n or not isinstance(ai, int) or not 0 <= ai < len(opts):
            return [f"mcq needs {n} options and a valid answerIndex"]
        if len({o["label"] for o in opts}) != n:
            errs.append("duplicate option labels")
        vals = [o["value"] for o in opts if isinstance(o.get("value"), (int, float))]
        if len(vals) == n and vals != sorted(vals):
            errs.append("options not sorted")
        ans = (it.get("answer") or {}).get("value")
        if isinstance(ans, (int, float)) and isinstance(opts[ai].get("value"), (int, float)):
            if abs(opts[ai]["value"] - ans) > 1e-9 * max(1.0, abs(ans)):
                errs.append("answer option value differs from answer")
            closest = min(range(n), key=lambda i: abs(opts[i]["value"] - ans))
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
        else:
            try:
                val = recompute_interval(it)
            except (KeyError, TypeError, ValueError, ZeroDivisionError) as e:
                val, _ = None, e
            if val is not None:
                it["_recomputed"] = True
                if abs(val - it["truth"]) > 1e-6 * max(1.0, abs(val)):
                    errs.append(f"Python recomputes {val} but the item says {it['truth']}")
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
    # Same objective as the JS solver: the most profitable single (indecomposable) package, at most 6 units.
    units = max(6, len((it.get("best") or {}).get("trades", [])))
    r = engine.call({"cmd": "orderbook", "board": it["board"], "maxUnits": units, "indecomposable": True})
    if not r["found"]:
        return ["C++ solver finds no arbitrage on this board"]
    if abs(r["profit"] - it["best"]["profit"]) > 1e-6:
        return [f"stated best profit {it['best']['profit']} but the exact optimum is {r['profit']}"]
    return []


def check_monte_carlo(engine: Engine, it: dict[str, Any], samples: int) -> list[str] | None:
    mapper = MC_MAPPERS.get(it.get("family", ""))
    if not mapper or not it.get("params"):
        return None
    try:
        spec = mapper(it["params"])
    except (KeyError, TypeError, IndexError):
        return None
    if spec is None:
        return None
    model, params = spec[0], spec[1]
    expected = (it.get("answer") or {}).get("value")
    if not isinstance(expected, (int, float)):
        return None
    if len(spec) > 2:
        expected = spec[2](expected)  # compare on the simulated quantity (e.g. a complement)
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
                if it.get("_recomputed"):
                    stats["python_recomputed"] += 1
                if engine and it.get("kind") == "interval" and it["family"] == "waiting-time" and (it.get("params") or {}).get("scenario") == "pattern" \
                        and all(a == 1 and b == 2 for _, a, b in it["params"].get("letterProbs", [])):
                    r = engine.call({"cmd": "mc", "model": "pattern_wait", "params": {"pattern": it["params"]["pattern"]}, "samples": samples, "seed": 5, "expected": it["truth"]})
                    stats["monte_carlo"] += 1
                    if not r["agrees"]:
                        errs.append(f"Monte Carlo waiting time {r['mean']:.3f} disagrees with {it['truth']}")
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


def verify_zapn(export_file: Path) -> dict[str, Any]:
    """Re-solve JS-generated Zap-N puzzles in C++ and compare."""
    data = json.loads(export_file.read_text())
    res: dict[str, Any] = {}
    with Engine() as e:
        bad = []
        for i, L in enumerate(data["skyscraper"]):
            to_str = lambda towers: ["".join(str(b) for b in t) for t in towers]  # noqa: E731
            r = e.call({"cmd": "tower_solve", "caps": L["caps"], "start": to_str(L["start"]), "target": to_str(L["target"])})
            if r["optimal"] != L["opt"]:
                bad.append({"i": i, "js": L["opt"], "cpp": r["optimal"]})
        res["skyscraper"] = {"checked": len(data["skyscraper"]), "mismatches": bad}
        bad = []
        for i, R in enumerate(data["numberbox"]):
            s = e.call({"cmd": "numberbox", "numbers": R["nums"], "target": R["target"]})
            v = e.call({"cmd": "numberbox_eval", "expression": R["solution"].replace("*", "×").replace("/", "÷")})
            if not s["solvable"] or v["value"] != str(R["target"]):
                bad.append({"i": i, "nums": R["nums"], "target": R["target"], "solution": R["solution"], "cppValue": v["value"]})
        res["numberbox"] = {"checked": len(data["numberbox"]), "mismatches": bad}
        bad = []
        for F in data["figure"]:
            r = e.call({"cmd": "figure", "values": F["values"]})
            if abs(r["expected"] - F["expected"]) > 1e-9 or abs(r["expectedDp"] - F["expected"]) > 1e-9 or r["worstCase"] != F["worst"]:
                bad.append({"values": F["values"], "js": F["expected"], "cpp": r["expected"], "dp": r["expectedDp"]})
        res["figure"] = {"checked": len(data["figure"]), "mismatches": bad}
        bad = []
        for B in data["balloon"]:
            r = e.call({"cmd": "balloon", "balloons": B["balloons"], "cents": B["centsPerPump"], "popMax": B["popMax"], "penalty": B["bankPenalty"]})
            if abs(r["expectedCents"] - B["ev"]) > 1e-6 or r["optimalAtStart"] != B["firstTarget"]:
                bad.append({"round": B, "cpp": r})
        res["balloon"] = {"checked": len(data["balloon"]), "mismatches": bad}
    res["ok"] = all(not v["mismatches"] for v in res.values() if isinstance(v, dict))
    return res
