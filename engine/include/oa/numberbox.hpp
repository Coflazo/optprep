#pragma once
// NumberBox (the "24 game" family): combine the numbers with + - * / and brackets,
// each used once, to reach the target. Exhaustive search with exact rationals.
#include <map>
#include <string>
#include <vector>

#include "oa/rational.hpp"

namespace oa {

struct NumberBoxResult {
    bool solvable = false;
    long long derivations = 0;  // number of distinct combination orders reaching the target (difficulty proxy)
    std::string expression;     // one solution, fully bracketed
};

[[nodiscard]] NumberBoxResult solve_numberbox(const std::vector<int>& numbers, const Rational& target);
// Every integer reachable from the numbers, with its derivation count.
[[nodiscard]] std::map<long long, long long> reachable_integers(const std::vector<int>& numbers);
[[nodiscard]] Rational eval_expression(const std::string& expr);

}  // namespace oa
