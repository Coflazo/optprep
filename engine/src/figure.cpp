#include "oa/figure.hpp"

#include <algorithm>
#include <map>
#include <stdexcept>

namespace oa {

double figure_expected_formula(const std::vector<int>& v) {
    const int m = *std::max_element(v.begin(), v.end());
    double e = 0;
    for (int t = 1; t <= m; ++t) {  // E[max] = sum_t P(max >= t) = sum_t (1 - prod_j P(T_j < t))
        double below = 1;
        for (const int vj : v) below *= std::min(1.0, static_cast<double>(t - 1) / vj);
        e += 1 - below;
    }
    return e;
}

namespace {
// State: remaining candidates per property (1 = known but must still be named in the final guess).
double dp(std::vector<int> c, std::map<std::vector<int>, double>& memo) {
    std::sort(c.begin(), c.end());
    if (const auto it = memo.find(c); it != memo.end()) return it->second;
    // Enumerate outcomes of one guess: each property j is right with probability 1/c_j.
    double expect = 1;  // this guess
    const std::size_t k = c.size();
    for (unsigned mask = 0; mask < (1u << k); ++mask) {  // bit set = property guessed right
        double p = 1;
        std::vector<int> next;
        bool all_right = true;
        for (std::size_t j = 0; j < k; ++j) {
            const bool right = mask & (1u << j);
            if (c[j] == 1 && !right) { p = 0; break; }
            p *= right ? 1.0 / c[j] : 1.0 - 1.0 / c[j];
            if (right) next.push_back(1);
            else { next.push_back(c[j] - 1); all_right = false; }
        }
        if (p == 0 || all_right) continue;
        expect += p * dp(next, memo);
    }
    memo[c] = expect;
    return expect;
}
}  // namespace

double figure_expected_dp(const std::vector<int>& v) {
    if (v.empty() || v.size() > 12) throw std::invalid_argument("figure: 1 to 12 properties");
    std::map<std::vector<int>, double> memo;
    return dp(v, memo);
}

int figure_worst_case(const std::vector<int>& v) { return *std::max_element(v.begin(), v.end()); }

double figure_expected_one_at_a_time(const std::vector<int>& v) {
    // Fix properties one by one: property j costs T_j guesses where the last try of each
    // property is shared with the next; total = sum_j (T_j) - (k - 1) on average.
    double e = 0;
    for (const int vj : v) e += (vj + 1) / 2.0;
    return e - static_cast<double>(v.size() - 1);
}

}  // namespace oa
