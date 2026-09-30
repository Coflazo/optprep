#pragma once
// Parallel Monte Carlo used to cross-check the trainer's exact probability answers.
// A model turns JSON params into a sampler: one call = one independent trial,
// returning an indicator (probabilities) or a value (expectations).
#include <cstdint>
#include <functional>
#include <string>
#include <vector>

#include "oa/json.hpp"
#include "oa/rng.hpp"

namespace oa {

using Sampler = std::function<double(Rng&)>;

struct McResult {
    double mean = 0;
    double std_error = 0;
    std::uint64_t samples = 0;
    // True when `expected` lies within `sigmas` standard errors (plus a tiny absolute slack for exact 0/1 answers).
    [[nodiscard]] bool agrees(double expected, double sigmas = 4.0) const noexcept;
};

[[nodiscard]] Sampler make_sampler(const std::string& model, const Json& params);
[[nodiscard]] std::vector<std::string> model_names();
[[nodiscard]] McResult run_parallel(const Sampler& sampler, std::uint64_t samples, std::uint64_t seed, unsigned threads = 0);

}  // namespace oa
