"""Ability model and exam forecast.

Binary sections (Beat the Odds, NumberLogic, Likelihood List, Orderbooks) use a
logistic model per section:

    logit P(correct) = theta + b[family] - gamma * (difficulty - 3)

fitted by penalised Newton-Raphson on answers aggregated into (family, difficulty)
cells. The ridge prior keeps unseen or rarely seen families near the section
average instead of at plus or minus infinity.

The forecast simulates whole exams: questions drawn like the real exam, each
answered with the model probability. For +1/-1 sections the simulated candidate
skips any question with P(correct) < 0.5, because answering it has negative
expected value (EV = 2p - 1). A nonparametric bootstrap over the answers carries
the fitting uncertainty into the interval and into P(meet target).
"""
from __future__ import annotations

import math
import random
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any

EXAMS: dict[str, dict[str, Any]] = {
    "bto": {"count": 20, "scoring": "plusMinus", "target": ("netPct", 0.6), "ramp": False},
    "nl": {"count": 26, "scoring": "plusMinus", "target": ("net", 18), "ramp": True},
    "ll": {"count": 15, "scoring": "binary", "target": ("net", 12), "ramp": False},
    "iv": {"count": 18, "scoring": "ratio", "target": ("mean", 0.7), "ramp": False},
    "ob": {"count": 20, "scoring": "binary", "target": ("net", 17), "ramp": False},
}


def sigmoid(x: float) -> float:
    if x >= 0:
        return 1.0 / (1.0 + math.exp(-x))
    e = math.exp(x)
    return e / (1.0 + e)


def solve(a: list[list[float]], b: list[float]) -> list[float]:
    """Gaussian elimination with partial pivoting (small dense systems)."""
    n = len(b)
    m = [row[:] + [b[i]] for i, row in enumerate(a)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(m[r][c]))
        if abs(m[p][c]) < 1e-12:
            raise ArithmeticError("singular Hessian")
        m[c], m[p] = m[p], m[c]
        for r in range(n):
            if r != c and m[r][c] != 0.0:
                f = m[r][c] / m[c][c]
                for k in range(c, n + 1):
                    m[r][k] -= f * m[c][k]
    return [m[i][n] / m[i][i] for i in range(n)]


@dataclass
class LogisticModel:
    theta: float = 0.0
    gamma: float = 0.5
    easiness: dict[str, float] = field(default_factory=dict)

    def prob(self, family: str, difficulty: int | None) -> float:
        d = 3 if difficulty is None else difficulty
        return sigmoid(self.theta + self.easiness.get(family, 0.0) - self.gamma * (d - 3))


def cells(rows: list[dict[str, Any]]) -> dict[tuple[str, int], list[int]]:
    agg: dict[tuple[str, int], list[int]] = defaultdict(lambda: [0, 0])
    for r in rows:
        key = (r["family"], int(r.get("difficulty") or 3))
        agg[key][0] += 1
        agg[key][1] += 1 if r["correct"] else 0
    return agg


def fit_logistic(rows: list[dict[str, Any]], ridge: float = 1.0, iters: int = 30) -> LogisticModel:
    agg = cells(rows)
    fams = sorted({f for f, _ in agg})
    idx = {f: i + 2 for i, f in enumerate(fams)}  # 0 = theta, 1 = gamma
    n = len(fams) + 2
    w = [0.0, 0.5] + [0.0] * len(fams)
    prior_mean = [0.0, 0.5] + [0.0] * len(fams)
    prior_prec = [0.1, 1.0] + [ridge] * len(fams)  # weak prior on theta, moderate on gamma
    for _ in range(iters):
        grad = [-prior_prec[i] * (w[i] - prior_mean[i]) for i in range(n)]
        hess = [[0.0] * n for _ in range(n)]
        for i in range(n):
            hess[i][i] = -prior_prec[i]
        for (f, d), (count, k) in agg.items():
            x = [0.0] * n
            x[0], x[1], x[idx[f]] = 1.0, -(d - 3), 1.0
            z = sum(w[i] * x[i] for i in (0, 1, idx[f]))
            p = sigmoid(z)
            for i in (0, 1, idx[f]):
                grad[i] += (k - count * p) * x[i]
                for j in (0, 1, idx[f]):
                    hess[i][j] -= count * p * (1 - p) * x[i] * x[j]
        step = solve(hess, grad)
        w = [w[i] - step[i] for i in range(n)]
        if max(abs(s) for s in step) < 1e-8:
            break
    return LogisticModel(theta=w[0], gamma=w[1], easiness={f: w[idx[f]] for f in fams})


def exam_plan(section: str, families: list[str], rng: random.Random) -> list[tuple[str, int]]:
    cfg = EXAMS[section]
    count = cfg["count"]
    order = rng.sample(families, len(families)) if families else ["?"]
    plan = []
    for i in range(count):
        d = 1 + int(i / count * 5) if cfg["ramp"] else 1 + i % 5
        plan.append((order[i % len(order)], d))
    return plan


def _meets(score: float, max_score: float, target: tuple[str, float]) -> bool:
    metric, value = target
    if metric == "net":
        return score >= value
    return max_score > 0 and score / max_score >= value


def forecast_section(section: str, rows: list[dict[str, Any]], families: list[str],
                     boot: int = 60, sims: int = 40, seed: int = 0) -> dict[str, Any]:
    cfg = EXAMS[section]
    rng = random.Random(seed)
    scores: list[float] = []
    point = None
    for b in range(boot + 1):
        sample = rows if b == 0 else [rows[rng.randrange(len(rows))] for _ in rows] if rows else []
        if cfg["scoring"] == "ratio":
            per_family = _shrunk_means(sample)
            prob = lambda fam, d: per_family.get(fam, per_family.get("*", 0.0))  # noqa: E731
        else:
            model = fit_logistic(sample)
            prob = model.prob
        for _ in range(sims if b else 1):
            plan = exam_plan(section, families, rng)
            total = 0.0
            for fam, d in plan:
                p = prob(fam, d)
                if cfg["scoring"] == "plusMinus":
                    if p < 0.5:
                        continue  # skip: answering has negative expected value
                    total += 1 if rng.random() < p else -1
                elif cfg["scoring"] == "binary":
                    total += 1 if rng.random() < p else 0
                else:
                    total += p if b == 0 else min(1.0, max(0.0, rng.gauss(p, 0.1)))
            if b == 0:
                point = total
            else:
                scores.append(total)
    scores.sort()
    max_score = float(cfg["count"])
    lo = scores[int(0.1 * (len(scores) - 1))] if scores else 0.0
    hi = scores[int(0.9 * (len(scores) - 1))] if scores else 0.0
    expected = sum(scores) / len(scores) if scores else float(point or 0.0)
    p_meet = sum(1 for s in scores if _meets(s, max_score, cfg["target"])) / len(scores) if scores else 0.0
    return {"section": section, "expected": round(expected, 2), "interval": [round(lo, 2), round(hi, 2)],
            "max": max_score, "pMeetTarget": round(p_meet, 3), "answers": len(rows)}


def _shrunk_means(rows: list[dict[str, Any]], k: float = 5.0) -> dict[str, float]:
    """Empirical-Bayes family means for continuous scores, shrunk toward the section mean."""
    if not rows:
        return {"*": 0.0}
    overall = sum(float(r.get("score", 1.0 if r["correct"] else 0.0)) for r in rows) / len(rows)
    by: dict[str, list[float]] = defaultdict(list)
    for r in rows:
        by[r["family"]].append(float(r.get("score", 1.0 if r["correct"] else 0.0)))
    out = {f: (sum(v) + k * overall) / (len(v) + k) for f, v in by.items()}
    out["*"] = overall
    return out


def calibration(rows: list[dict[str, Any]]) -> dict[str, Any]:
    """Accuracy per stated confidence, Brier score, and whether guessing when unsure pays under -1 scoring."""
    by: dict[float, list[bool]] = defaultdict(list)
    for r in rows:
        if r.get("confidence") is not None:
            by[round(float(r["confidence"]), 2)].append(bool(r["correct"]))
    buckets = [{"confidence": c, "n": len(v), "accuracy": sum(v) / len(v)} for c, v in sorted(by.items())]
    n = sum(b["n"] for b in buckets)
    brier = sum((c - (1.0 if x else 0.0)) ** 2 for c, v in by.items() for x in v) / n if n else None
    unsure = [b for b in buckets if b["confidence"] < 0.8]
    unsure_acc = (sum(b["accuracy"] * b["n"] for b in unsure) / sum(b["n"] for b in unsure)) if unsure else None
    return {"buckets": buckets, "brier": brier, "skipWhenUnsure": unsure_acc is not None and unsure_acc < 0.5,
            "unsureAccuracy": unsure_acc}


def weakest_families(section: str, rows: list[dict[str, Any]], families: list[str], top: int = 3) -> list[dict[str, Any]]:
    """Families where an improvement would add the most expected exam points."""
    if EXAMS[section]["scoring"] == "ratio":
        means = _shrunk_means(rows)
        ranked = sorted(families, key=lambda f: means.get(f, means["*"]))
        return [{"family": f, "p": round(means.get(f, means["*"]), 3)} for f in ranked[:top]]
    model = fit_logistic(rows)
    ranked = sorted(families, key=lambda f: model.prob(f, 3))
    return [{"family": f, "p": round(model.prob(f, 3), 3)} for f in ranked[:top]]
