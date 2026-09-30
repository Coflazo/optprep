#pragma once
// JSON command dispatcher shared by the CLI and the tests.
#include "oa/json.hpp"

namespace oa {

// Runs one {"cmd": ...} request. Never throws: errors come back as {"ok": false, "error": ...}.
[[nodiscard]] Json dispatch(const Json& request);

}  // namespace oa
