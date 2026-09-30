#pragma once
// NumberLogic ambiguity checker. Fits a library of rule templates to the shown
// terms with exact rationals and returns every continuation that some rule
// explains, ranked by rule complexity. A question is ambiguous when a wrong option
// is explained by a rule at least as simple as the intended one.
#include <string>
#include <vector>

#include "oa/rational.hpp"

namespace oa {

struct Prediction {
    std::string rule;
    Rational next;
    int complexity = 0;
};

[[nodiscard]] std::vector<Prediction> predict_next(const std::vector<Rational>& terms);
[[nodiscard]] Rational rational_from_double(double x, long long max_den = 10000);

}  // namespace oa
