from oa_backend.db import Database


def test_answers_and_runs_round_trip(tmp_path):
    db = Database(tmp_path / "t.db")
    db.add_answers([
        {"section": "bto", "family": "two-dice-sum", "correct": True, "ms": 4000, "difficulty": 1, "confidence": 0.9},
        {"section": "bto", "family": "two-dice-sum", "correct": False, "ms": 9000, "difficulty": 2},
    ])
    db.add_run({"section": "bto", "mode": "exam", "score": 12, "max": 20})
    answers = db.answers("bto")
    assert len(answers) == 2
    assert answers[0]["correct"] is True and answers[1]["confidence"] is None
    assert db.runs("bto", "exam")[0]["score"] == 12


def test_state_snapshot_is_versioned_last_write_wins(tmp_path):
    db = Database(tmp_path / "t.db")
    assert db.get_state() is None
    db.put_state({"version": 1, "runs": []})
    db.put_state({"version": 1, "runs": [{"section": "nl"}]})
    assert db.get_state()["runs"] == [{"section": "nl"}]


def test_rejects_bad_answer_rows(tmp_path):
    db = Database(tmp_path / "t.db")
    try:
        db.add_answers([{"section": "bto"}])
    except ValueError as e:
        assert "family" in str(e)
    else:
        raise AssertionError("expected ValueError")
