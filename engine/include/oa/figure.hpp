#pragma once
// Figure It Out: a hidden figure has k properties with v_j possible values each.
// A guess names one value per property; feedback says which properties are right.
// Because feedback is per property, the problem splits: the optimal expected number
// of guesses is E[max_j T_j] with T_j uniform on 1..v_j (test one new value per
// unsolved property each guess). `figure_dp` computes the same optimum by dynamic
// programming over remaining-candidate counts, as an independent check.
#include <vector>

namespace oa {

[[nodiscard]] double figure_expected_formula(const std::vector<int>& values);
[[nodiscard]] double figure_expected_dp(const std::vector<int>& values);
[[nodiscard]] int figure_worst_case(const std::vector<int>& values);
// Expected guesses of the naive "change one property at a time" strategy (for the coach).
[[nodiscard]] double figure_expected_one_at_a_time(const std::vector<int>& values);

}  // namespace oa
