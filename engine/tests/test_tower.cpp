#include <gtest/gtest.h>
#include "oa/tower.hpp"

using namespace oa;

TEST(Tower, BfsFindsShortestSolution) {
    const std::vector<int> caps{3, 2, 1};
    const Towers start{"abc", "", ""};
    const Towers target{"", "cb", "a"};  // move c, b off, then a to the small tower
    const int d = tower_distance(start, target, caps);
    EXPECT_GT(d, 0);
    const auto path = tower_path(start, target, caps);
    ASSERT_EQ(static_cast<int>(path.size()), d + 1);
    EXPECT_EQ(path.front(), start);
    EXPECT_EQ(path.back(), target);
}

TEST(Tower, GeneratedLevelsHaveExactlyTheStatedOptimum) {
    const std::vector<int> caps{3, 3, 3};
    const Towers target{"abc", "de", ""};
    for (int depth = 2; depth <= 6; ++depth) {
        const auto levels = tower_levels(target, caps, depth, 5, 42);
        ASSERT_FALSE(levels.empty()) << depth;
        for (const auto& l : levels) EXPECT_EQ(tower_distance(l.start, l.target, caps), depth);
    }
}

TEST(Tower, RejectsOverfullTowers) {
    EXPECT_THROW(static_cast<void>(tower_distance({"abcd", "", ""}, {"", "", ""}, {3, 3, 3})), std::invalid_argument);
}
