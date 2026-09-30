"""One command for the whole check:  uv run python -m oa_backend.pipeline

1. Node exports every section's fixed library and a Zap-N puzzle sample.
2. Python re-checks every question; the C++ engine re-solves the heavy ones.
3. The report lands in backend/data/verification/report.json (served at /api/verification).
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

from .engine import available
from .verify import DATA, verify, verify_zapn

REPO = Path(__file__).resolve().parents[2]


def main() -> int:
    for script in ("tools/export-library.mjs", "tools/export-zapn.mjs"):
        subprocess.run(["node", script], cwd=REPO, check=True)
    if not available():
        print("oa-engine not built: run cmake --build engine/build first", file=sys.stderr)
        return 2
    report = verify(DATA / "library")
    report["zapn"] = verify_zapn(DATA / "zapn" / "export.json")
    report["ok"] = report["ok"] and report["zapn"]["ok"]
    out = DATA / "verification" / "report.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=1))
    for sec, s in report["sections"].items():
        st = s["stats"]
        print(f"{sec}: {st.get('items', 0)} checked, {st.get('failed', 0)} failed, {st.get('warnings', 0)} warnings")
    z = report["zapn"]
    print("zapn: " + ", ".join(f"{k} {v['checked']} checked / {len(v['mismatches'])} mismatches" for k, v in z.items() if isinstance(v, dict)))
    print(f"ok={report['ok']}")
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
