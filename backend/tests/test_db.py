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


def test_v1_database_gains_v2_answer_columns(tmp_path):
    import sqlite3
    path = tmp_path / "old.db"
    old = sqlite3.connect(path)
    old.executescript("CREATE TABLE answers (id INTEGER PRIMARY KEY, at REAL NOT NULL, section TEXT NOT NULL, family TEXT NOT NULL,"
                      " correct INTEGER NOT NULL, ms REAL NOT NULL DEFAULT 0, difficulty INTEGER, confidence REAL, score REAL);"
                      "INSERT INTO answers (at, section, family, correct) VALUES (1, 'bto', 'f', 1);")
    old.commit()
    old.close()
    db = Database(path)
    db.add_answers([{"section": "mm", "family": "mm-missing", "correct": False, "item_id": "mm:mm-missing:7", "mode": "practice", "hints": 0, "belief": "Answered the operand"}])
    rows = db.answers()
    assert len(rows) == 2
    assert rows[1]["item_id"] == "mm:mm-missing:7" and rows[1]["belief"] == "Answered the operand"
    assert rows[0]["item_id"] is None
    Database(path)  # reopening is a no-op
