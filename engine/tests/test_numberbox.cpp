#include <gtest/gtest.h>
#include "oa/numberbox.hpp"

using namespace oa;

TEST(NumberBox, SolvesClassicTwentyFours) {
    const auto r = solve_numberbox({5, 7, 10, 8}, Rational(24));
    ASSERT_TRUE(r.solvable);
    EXPECT_EQ(eval_expression(r.expression), Rational(24));
    // 3 3 8 8 needs fractions: 8 / (3 - 8/3) = 24
    const auto hard = solve_numberbox({3, 3, 8, 8}, Rational(24));
    ASSERT_TRUE(hard.solvable);
    EXPECT_EQ(eval_expression(hard.expression), Rational(24));
}

TEST(NumberBox, KnowsUnsolvableSets) {
    EXPECT_FALSE(solve_numberbox({1, 1, 1, 1}, Rational(24)).solvable);
}

TEST(NumberBox, ReachableIntegersIncludeKnownValues) {
    const auto reach = reachable_integers({1, 2, 3, 4});
    EXPECT_TRUE(reach.count(24));
    EXPECT_TRUE(reach.count(10));
    EXPECT_FALSE(reach.count(1000));
}

TEST(NumberBox, EvaluatorIsExact) {
    EXPECT_EQ(eval_expression("8 ÷ (3 − 8 ÷ 3)"), Rational(24));
    EXPECT_EQ(eval_expression("(1 + 2) × 3 - 4 / 2"), Rational(7));
    EXPECT_THROW(static_cast<void>(eval_expression("(1 + 2")), std::invalid_argument);
}
