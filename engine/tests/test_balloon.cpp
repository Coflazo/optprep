#include <gtest/gtest.h>
#include "oa/balloon.hpp"

using namespace oa;

TEST(Balloon, RoundOneOptimumIsHalfThePopRange) {
    // No bank penalty: each balloon is independent, maximise k * c * (N - k) / N -> k = N / 2.
    const auto p = balloon_optimal(30, 10, 20, 0.0);
    EXPECT_EQ(p.optimal_at_start, 10);
    EXPECT_NEAR(p.expected_cents, 30 * 10 * 10 * 0.5, 1e-9);  // $15.00, matches the JS engine
}

TEST(Balloon, BankPenaltyMakesLaterBalloonsMoreCautious) {
    const int empty = balloon_best_pumps(10, 0, 20, 20, 0.5);
    const int rich = balloon_best_pumps(10, 2000, 20, 20, 0.5);
    EXPECT_LT(rich, empty);
    EXPECT_EQ(empty, 11);  // matches the JS engine's round-2 optimum at an empty bank
}
