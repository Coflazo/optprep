#pragma once
// Exact orderbook arbitrage: choose integer buy/sell unit counts per instrument so
// the net position in every product is zero and cash is maximised. Branch and
// bound over instruments with two bounds (flatness reachability and cash ceiling).
#include <string>
#include <vector>

namespace oa {

struct Instrument {
    std::string id;
    std::vector<int> legs;  // quantity of each product in one unit
    double bid = 0;          // you sell here
    double ask = 0;          // you buy here
};

struct Board {
    std::vector<std::string> products;
    std::vector<Instrument> instruments;
};

struct Trade {
    std::string id;
    bool buy = true;
    int units = 1;
};

struct ObSolution {
    bool found = false;
    double profit = 0;
    int units = 0;
    long long nodes = 0;
    std::vector<Trade> trades;
};

[[nodiscard]] ObSolution solve_orderbook(const Board& board, int max_units);
[[nodiscard]] double position_cash(const Board& board, const std::vector<Trade>& trades);
[[nodiscard]] bool position_flat(const Board& board, const std::vector<Trade>& trades);

}  // namespace oa
