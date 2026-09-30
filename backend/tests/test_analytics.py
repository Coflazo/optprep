import math
import random

from oa_backend.analytics import calibration, fit_logistic, forecast_section, sigmoid


def synth(theta, easiness, gamma=0.6, n=40, seed=1):
    rng = random.Random(seed)
    rows = []
    for fam, b in easiness.items():
        for d in range(1, 6):
            p = sigmoid(theta + b - gamma * (d - 3))
            for _ in range(n):
                rows.append({"family": fam, "difficulty": d, "correct": rng.random() < p})
    return rows


def test_fit_recovers_probabilities():
    easiness = {"a": 0.8, "b": -0.5, "c": 0.0}
    model = fit_logistic(synth(0.4, easiness, n=120))
    for fam, b in easiness.items():
        for d in (1, 3, 5):
            true = sigmoid(0.4 + b - 0.6 * (d - 3))
            assert abs(model.prob(fam, d) - true) < 0.08, (fam, d)
    assert model.prob("unseen", 3) > 0.3  # unseen families fall back to the prior


def test_forecast_rises_with_ability_and_is_reproducible():
    fams = ["a", "b", "c"]
    weak = forecast_section("bto", synth(-0.8, {f: 0.0 for f in fams}), fams, seed=3)
    strong = forecast_section("bto", synth(1.5, {f: 0.0 for f in fams}), fams, seed=3)
    assert strong["expected"] > weak["expected"]
    assert strong["pMeetTarget"] >= weak["pMeetTarget"]
    assert strong["interval"][0] <= strong["expected"] <= strong["interval"][1]
    assert forecast_section("bto", synth(1.5, {f: 0.0 for f in fams}), fams, seed=3) == strong


def test_forecast_skips_questions_below_half_under_minus_one_scoring():
    # A candidate at 30% should skip nearly everything, so expected net stays near 0, not strongly negative.
    fams = ["a"]
    f = forecast_section("bto", synth(-1.2, {"a": 0.0}), fams, seed=5)
    assert f["expected"] > -1.0


def test_interval_section_uses_mean_scores():
    rows = [{"family": "count", "difficulty": 2, "correct": True, "score": s} for s in (0.6, 0.7, 0.8, 0.75)] * 5
    f = forecast_section("iv", rows, ["count"], seed=2)
    assert 0.6 < f["expected"] / f["max"] < 0.8


def test_calibration_buckets():
    rows = [{"confidence": 0.9, "correct": True}] * 9 + [{"confidence": 0.9, "correct": False}] + \
           [{"confidence": 0.6, "correct": True}] * 4 + [{"confidence": 0.6, "correct": False}] * 6
    c = calibration(rows)
    sure = next(b for b in c["buckets"] if b["confidence"] == 0.9)
    unsure = next(b for b in c["buckets"] if b["confidence"] == 0.6)
    assert math.isclose(sure["accuracy"], 0.9) and math.isclose(unsure["accuracy"], 0.4)
    assert c["skipWhenUnsure"] is True
