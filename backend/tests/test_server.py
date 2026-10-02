import json
import threading
import urllib.error
import urllib.request

import pytest

from oa_backend.server import is_private, make_server


@pytest.fixture()
def server(tmp_path):
    srv = make_server(0, tmp_path / "s.db")
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    yield f"http://127.0.0.1:{srv.server_address[1]}"
    srv.shutdown()


def call(url, method="GET", body=None, headers=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={"Content-Type": "application/json", **(headers or {})})
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


def test_health_answers_state_and_analytics(server):
    assert call(server + "/api/health")[1]["ok"] is True
    rows = [{"section": "bto", "family": "f", "correct": i % 3 != 0, "difficulty": 1 + i % 5, "confidence": 0.9} for i in range(60)]
    assert call(server + "/api/answers", "POST", rows)[1]["stored"] == 60
    assert call(server + "/api/state", "PUT", {"version": 1, "runs": []})[0] == 200
    assert call(server + "/api/state")[1]["state"] == {"version": 1, "runs": []}
    a = call(server + "/api/analytics")[1]
    assert a["sections"]["bto"]["forecast"]["answers"] == 60


def test_rejects_bad_input_and_unknown_banks(server):
    assert call(server + "/api/state", "PUT", {"version": 3})[0] == 400
    assert call(server + "/api/state", "PUT", {"version": 2, "runs": []})[0] == 200
    assert call(server + "/api/answers", "POST", [{"section": "bto"}])[0] == 400
    assert call(server + "/api/banks/..%2Fsecret")[0] == 404
    assert call(server + "/api/nope")[0] == 404


def test_serves_the_static_app(server):
    with urllib.request.urlopen(server + "/index.html") as r:
        assert b'src="app.js"' in r.read()
        assert r.headers["Cache-Control"] == "no-store"
    # ES modules need a JavaScript MIME type on every OS (Windows can map .js to text/plain).
    with urllib.request.urlopen(server + "/app.js") as r:
        assert r.headers["Content-Type"] == "text/javascript"
        assert r.headers["X-Content-Type-Options"] == "nosniff"


def test_other_origins_cannot_write_or_rebind(server):
    # A cross-origin "simple" request (text/plain) must not reach the database.
    status, _ = call(server + "/api/answers", "POST", [{"section": "bto", "family": "f", "correct": True}], {"Content-Type": "text/plain"})
    assert status == 415
    # DNS rebinding: a foreign Host header is refused for API and files alike.
    assert call(server + "/api/state", headers={"Host": "evil.example"})[0] == 403


def test_private_files_are_not_served(server):
    # %62 is "b"; /Backend only differs in case, which a case-insensitive file system ignores.
    for path in ("/.git/config", "/backend/data/progress.db", "/engine/CMakeLists.txt", "/%2egit/config",
                 "/%62ackend/pyproject.toml", "/Backend/pyproject.toml", "/%42ACKEND/pyproject.toml"):
        try:
            with urllib.request.urlopen(server + path) as r:
                status = r.status
        except urllib.error.HTTPError as e:
            status = e.code
        assert status == 404, path


def test_private_path_policy_decodes_then_casefolds():
    for path in ("/%62ackend/data/progress.db", "/Backend/data/progress.db", "/ENGINE/CMakeLists.txt",
                 "/src/%2e%2e/backend/pyproject.toml", "/..%2f.git/config", "/%252e%252e/x", "/backend./x",
                 "/BACKEN~1/x", "/a%5c..%5cbackend/x", "/bac%E2%84%AAend/x", "/brag-output-2/a.md", "/.env"):
        assert is_private(path), path
    for path in ("/", "/index.html", "/app.js?v=1", "/src/study/diagrams/_util.js", "/manifest.webmanifest"):
        assert not is_private(path), path
