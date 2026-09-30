#include "oa/balloon.hpp"

#include <cmath>
#include <map>
#include <stdexcept>
#include <utility>

namespace oa {

namespace {

struct Dp {
    int cents, n;
    double penalty;
    std::map<std::pair<int, int>, std::pair<double, int>> memo;  // (left, bank) -> (value of future, best pumps)

    // Expected FUTURE gain from here (bank already counted separately; losses are negative gains).
    std::pair<double, int> solve(int left, int bank) {
        if (left == 0) return {0, 0};
        const auto k = std::make_pair(left, bank);
        if (const auto it = memo.find(k); it != memo.end()) return it->second;
        std::pair<double, int> best{-1e18, 0};
        for (int pumps = 0; pumps <= n; ++pumps) {
            // survive if pop point > pumps: probability (n - pumps) / n
            const double ps = static_cast<double>(n - pumps) / n;
            const int gain = pumps * cents;
            const int lost = static_cast<int>(std::floor(bank * penalty));
            double v = 0;
            if (ps > 0) v += ps * (gain + solve(left - 1, bank + gain).first);
            if (ps < 1) v += (1 - ps) * (-lost + solve(left - 1, bank - lost).first);
            if (v > best.first + 1e-12) best = {v, pumps};
        }
        memo[k] = best;
        return best;
    }
};

}  // namespace

BalloonPolicy balloon_optimal(int balloons, int cents, int pop_max, double bank_penalty) {
    if (balloons <= 0 || cents <= 0 || pop_max <= 1) throw std::invalid_argument("balloon parameters");
    Dp dp{cents, pop_max, bank_penalty, {}};
    BalloonPolicy p;
    p.expected_cents = dp.solve(balloons, 0).first;
    p.optimal_at_start = dp.solve(balloons, 0).second;
    for (int left = 1; left <= balloons; ++left) p.first_actions.push_back(dp.solve(left, 0).second);
    return p;
}

int balloon_best_pumps(int balloons_left, int bank_cents, int cents, int pop_max, double bank_penalty) {
    Dp dp{cents, pop_max, bank_penalty, {}};
    return dp.solve(balloons_left, bank_cents).second;
}

}  // namespace oa
