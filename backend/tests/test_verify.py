from oa_backend.analytics import EXAMS, forecast_section
from oa_backend.verify import check_structure


def mcq(values, answer_index, **extra):
    opts = [{"label": str(v), "value": v, "misconception": None if i == answer_index else "a named slip"}
            for i, v in enumerate(values)]
    return {"kind": "mcq", "options": opts, "answerIndex": answer_index, "answer": {"value": values[answer_index]}, **extra}


def test_mcq_needs_five_options_by_default():
    assert check_structure(mcq([1, 2, 3, 4, 5], 2)) == []
    assert check_structure(mcq([1, 2, 3, 4], 2)) == ["mcq needs 5 options and a valid answerIndex"]


def test_mcq_option_count_follows_the_item():
    assert check_structure(mcq([225, 226, 235, 325], 0, optionCount=4)) == []
    assert check_structure(mcq([1, 2, 3, 4, 5], 2, optionCount=4)) == ["mcq needs 4 options and a valid answerIndex"]
    bad = mcq([1, 2, 2, 4], 0, optionCount=4)
    assert "duplicate option labels" in check_structure(bad)


def test_eighty_in_eight_forecast_never_skips():
    assert EXAMS["mm"]["count"] == 80 and EXAMS["mm"]["target"] == ("net", 62)
    # A 40% candidate must answer every question: the expected net is negative, unlike a skipping section.
    rows = [{"family": "mm-addsub", "difficulty": d, "correct": i % 5 < 2} for i in range(200) for d in (1, 2, 3)]
    f = forecast_section("mm", rows, ["mm-addsub"], seed=1)
    assert f["max"] == 80.0 and f["expected"] < 0
