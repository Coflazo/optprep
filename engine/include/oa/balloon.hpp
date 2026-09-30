#pragma once
// Balloon (Balloon Analogue Risk Task): each pump earns `cents`; a balloon pops at a
// point uniform on 1..N pumps and loses its money. In round 2 a pop also costs
// half of the round's bank. Dynamic programming over (balloons left, bank) finds the
// optimal pump count for every state and its expected value.
#include <vector>

namespace oa {

struct BalloonPolicy {
    double expected_cents = 0;        // from an empty bank with all balloons left
    std::vector<int> first_actions;   // optimal pumps at bank 0 for balloons_left = 1..B
    int optimal_at_start = 0;
};

// bank_penalty: fraction of the bank lost on a pop (0 in round 1, 0.5 in round 2).
[[nodiscard]] BalloonPolicy balloon_optimal(int balloons, int cents, int pop_max, double bank_penalty);
// Optimal pump count for a given state (used to score a candidate's run on the same pop points).
[[nodiscard]] int balloon_best_pumps(int balloons_left, int bank_cents, int cents, int pop_max, double bank_penalty);

}  // namespace oa
