#include <gtest/gtest.h>
#include "oa/orderbook.hpp"
#include "oa/rng.hpp"

using namespace oa;

namespace {
Board bundle_board() {
    // AB = A + B is quoted too high: buy A and B, sell AB for +1.
    return {{"A", "B"}, {{"A", {1, 0}, 10, 11}, {"B", {0, 1}, 20, 21}, {"AB", {1, 1}, 33, 34}}};
}

// Exhaustive reference: every signed quantity vector with total units <= U.
double brute(const Board& b, int U) {
    const std::size_t n = b.instruments.size();
    std::vector<int> q(n, -U);
    double best = 0;
    while (true) {
        int used = 0;
        for (const int x : q) used += std::abs(x);
        if (used <= U && used > 0) {
            std::vector<int> net(b.products.size(), 0);
            double cash = 0;
            for (std::size_t i = 0; i < n; ++i) {
                for (std::size_t k = 0; k < net.size(); ++k) net[k] += q[i] * b.instruments[i].legs[k];
                cash += q[i] > 0 ? -q[i] * b.instruments[i].ask : -q[i] * b.instruments[i].bid;
            }
            if (std::all_of(net.begin(), net.end(), [](int x) { return x == 0; })) best = std::max(best, cash);
        }
        std::size_t i = 0;
        while (i < n && ++q[i] > U) q[i++] = -U;
        if (i == n) break;
    }
    return best;
}
}  // namespace

TEST(Orderbook, FindsBundleArbitrage) {
    // Three units lock in +1; with a six-unit budget the arbitrage is done twice for +2.
    const auto one = solve_orderbook(bundle_board(), 3);
    ASSERT_TRUE(one.found);
    EXPECT_DOUBLE_EQ(one.profit, 1.0);
    const auto s = solve_orderbook(bundle_board(), 6);
    ASSERT_TRUE(s.found);
    EXPECT_DOUBLE_EQ(s.profit, 2.0);
    EXPECT_TRUE(position_flat(bundle_board(), s.trades));
    EXPECT_DOUBLE_EQ(position_cash(bundle_board(), s.trades), 2.0);
}

TEST(Orderbook, ReportsNoArbitrageOnFairBoard) {
    const Board fair{{"A", "B"}, {{"A", {1, 0}, 10, 11}, {"B", {0, 1}, 20, 21}, {"AB", {1, 1}, 30, 32}}};
    EXPECT_FALSE(solve_orderbook(fair, 6).found);
}

TEST(Orderbook, WeightedBundleNeedsTwoUnits) {
    const Board b{{"A", "C"}, {{"A", {1, 0}, 9.5, 10}, {"C", {0, 1}, 4.5, 5}, {"2A+C", {2, 1}, 26, 27}}};
    const auto s = solve_orderbook(b, 4);
    ASSERT_TRUE(s.found);
    EXPECT_DOUBLE_EQ(s.profit, 1.0);  // buy 2 A (20) + 1 C (5), sell the bundle at 26: four units
}

TEST(Orderbook, BranchAndBoundMatchesExhaustiveSearchOnRandomBoards) {
    Rng r(99);
    for (int trial = 0; trial < 60; ++trial) {
        Board b{{"A", "B", "C"}, {}};
        const std::vector<std::vector<int>> shapes = {{1, 0, 0}, {0, 1, 0}, {0, 0, 1}, {1, 1, 0}, {0, 1, 1}, {1, 0, -1}};
        const double fair[3] = {10.0 + static_cast<double>(r.below(20)), 10.0 + static_cast<double>(r.below(20)), 10.0 + static_cast<double>(r.below(20))};
        int idx = 0;
        for (const auto& legs : shapes) {
            double v = 0;
            for (std::size_t k = 0; k < 3; ++k) v += legs[k] * fair[k];
            const double skew = (static_cast<double>(r.below(5)) - 2.0) * 0.5;
            b.instruments.push_back({"I" + std::to_string(idx++), legs, v + skew - 0.5, v + skew + 0.5});
        }
        const auto s = solve_orderbook(b, 4);
        EXPECT_NEAR(s.found ? s.profit : 0.0, brute(b, 4), 1e-9) << "trial " << trial;
    }
}

TEST(Orderbook, IndecomposableModeReturnsOnePackage) {
    // With six units the plain optimum repeats the arbitrage (+2); one package is +1.
    const auto s = solve_orderbook(bundle_board(), 6, true);
    ASSERT_TRUE(s.found);
    EXPECT_DOUBLE_EQ(s.profit, 1.0);
    EXPECT_EQ(s.units, 3);
    EXPECT_TRUE(decomposable(bundle_board(), {2, 2, -2}));
    EXPECT_FALSE(decomposable(bundle_board(), {1, 1, -1}));
}
