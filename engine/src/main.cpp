// oa-engine: reads one JSON request per line on stdin, writes one JSON result per line.
//   echo '{"cmd":"mc","model":"dice_event","params":{"sums":[7]},"expected":0.1666667}' | oa-engine
#include <iostream>
#include <string>

#include "oa/commands.hpp"

int main() {
    std::ios::sync_with_stdio(false);
    std::string line;
    while (std::getline(std::cin, line)) {
        if (line.find_first_not_of(" \t\r") == std::string::npos) continue;
        oa::Json result;
        try {
            result = oa::dispatch(oa::Json::parse(line));
        } catch (const std::exception& e) {
            result = oa::Json(oa::Json::Object{{"ok", oa::Json(false)}, {"error", oa::Json(std::string(e.what()))}});
        }
        std::cout << result.dump() << '\n' << std::flush;
    }
    return 0;
}
