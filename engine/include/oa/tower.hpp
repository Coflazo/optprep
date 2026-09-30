#pragma once
// Skyscraper (Tower-of-London family): towers of coloured blocks with height caps;
// move the top block of one tower onto another that has room. BFS gives the
// optimal move count; reverse BFS from a target generates levels of exact depth.
#include <cstdint>
#include <string>
#include <vector>

#include "oa/rng.hpp"

namespace oa {

using Towers = std::vector<std::string>;  // bottom-to-top block colours per tower

struct TowerLevel {
    Towers start;
    Towers target;
    int optimal = 0;
};

[[nodiscard]] int tower_distance(const Towers& start, const Towers& target, const std::vector<int>& caps);  // -1 if unreachable
[[nodiscard]] std::vector<Towers> tower_path(const Towers& start, const Towers& target, const std::vector<int>& caps);
// Sample up to `count` distinct levels whose optimal solution is exactly `depth` moves.
[[nodiscard]] std::vector<TowerLevel> tower_levels(const Towers& target, const std::vector<int>& caps, int depth, int count, std::uint64_t seed);

}  // namespace oa
