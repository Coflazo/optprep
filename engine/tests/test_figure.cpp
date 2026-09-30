#include <gtest/gtest.h>
#include "oa/figure.hpp"

using namespace oa;

TEST(Figure, FormulaMatchesDynamicProgramming) {
    for (const auto& v : std::vector<std::vector<int>>{{2}, {3, 3}, {3, 4, 2}, {4, 4, 4}, {5, 3, 3, 2}, {6, 4, 3, 3, 2}}) {
        EXPECT_NEAR(figure_expected_formula(v), figure_expected_dp(v), 1e-9);
    }
}

TEST(Figure, SingleProperty) {
    EXPECT_NEAR(figure_expected_formula({4}), 2.5, 1e-12);  // uniform on 1..4
    EXPECT_EQ(figure_worst_case({4, 2, 3}), 4);
}

TEST(Figure, ParallelTestingBeatsOneAtATime) {
    const std::vector<int> v{4, 4, 4};
    EXPECT_LT(figure_expected_formula(v), figure_expected_one_at_a_time(v));
}
