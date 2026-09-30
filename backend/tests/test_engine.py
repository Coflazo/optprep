import pytest

from oa_backend.engine import Engine, EngineError, available

pytestmark = pytest.mark.skipif(not available(), reason="oa-engine not built")


def test_engine_answers_and_reports_errors():
    with Engine() as e:
        r = e.call({"cmd": "mc", "model": "dice_event", "params": {"sums": [11, 12]}, "samples": 400_000, "expected": 3 / 36})
        assert r["agrees"] is True
        nb = e.call({"cmd": "numberbox", "numbers": [3, 3, 8, 8], "target": 24})
        assert nb["solvable"] is True
        with pytest.raises(EngineError):
            e.call({"cmd": "no-such-command"})
        # the process survives an error and keeps answering
        assert e.call({"cmd": "figure", "values": [4]})["expected"] == pytest.approx(2.5)
