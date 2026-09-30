#include "oa/orderbook.hpp"

#include <algorithm>
#include <cmath>
#include <cstdlib>
#include <stdexcept>

namespace oa {

namespace {

bool flat_q(const Board& b, const std::vector<int>& q) {
    for (std::size_t k = 0; k < b.products.size(); ++k) {
        long long n = 0;
        for (std::size_t i = 0; i < q.size(); ++i) n += static_cast<long long>(q[i]) * b.instruments[i].legs[k];
        if (n != 0) return false;
    }
    return true;
}

struct Search {
    const Board& b;
    int max_units;
    bool indecomposable = false;
    std::vector<int> net;
    std::vector<int> qty;  // signed: +buy, -sell, per instrument
    std::vector<int> suffix_leg;  // max L1 leg size over instruments i.. (flatness bound)
    double suffix_bid = 0;
    std::vector<double> suffix_max_bid;
    ObSolution best;

    void dfs(std::size_t i, int used, double cash) {
        ++best.nodes;
        const int rem = max_units - used;
        long long imbalance = 0;
        for (const int x : net) imbalance += std::abs(x);
        if (i == b.instruments.size()) {
            if (imbalance == 0 && used > 0 && cash > 1e-9 && !(indecomposable && decomposable(b, qty))) {
                const bool better = !best.found || cash > best.profit + 1e-9 || (std::fabs(cash - best.profit) <= 1e-9 && used < best.units);
                if (better) {
                    best.found = true; best.profit = cash; best.units = used; best.trades.clear();
                    for (std::size_t k = 0; k < qty.size(); ++k)
                        if (qty[k] != 0) best.trades.push_back({b.instruments[k].id, qty[k] > 0, std::abs(qty[k])});
                }
            }
            return;
        }
        // Bound 1: the remaining units cannot move the net position enough to flatten it.
        if (imbalance > static_cast<long long>(rem) * suffix_leg[i]) return;
        // Bound 2: even the best per-unit cash on every remaining unit cannot beat the incumbent.
        if (best.found && cash + rem * std::max(0.0, suffix_max_bid[i]) < best.profit - 1e-9) return;
        const Instrument& ins = b.instruments[i];
        // Skip this instrument first (usually the cheapest branch), then buys and sells.
        dfs(i + 1, used, cash);
        for (int u = 1; u <= rem; ++u) {
            for (const int side : {+1, -1}) {
                for (std::size_t k = 0; k < net.size(); ++k) net[k] += side * u * ins.legs[k];
                qty[i] = side * u;
                dfs(i + 1, used + u, cash + (side > 0 ? -ins.ask : ins.bid) * u);
                qty[i] = 0;
                for (std::size_t k = 0; k < net.size(); ++k) net[k] -= side * u * ins.legs[k];
            }
        }
    }
};

}  // namespace

bool decomposable(const Board& board, const std::vector<int>& q) {
    // Enumerate every sub-position r with the same signs and |r_i| <= |q_i|, excluding 0 and q.
    std::vector<std::size_t> idx;
    long long total = 1;
    for (std::size_t i = 0; i < q.size(); ++i) if (q[i] != 0) { idx.push_back(i); total *= std::abs(q[i]) + 1; }
    std::vector<int> r(q.size(), 0);
    for (long long code = 1; code < total - 1; ++code) {
        long long c = code;
        for (const auto i : idx) {
            const int m = std::abs(q[i]) + 1;
            r[i] = (q[i] > 0 ? 1 : -1) * static_cast<int>(c % m);
            c /= m;
        }
        if (flat_q(board, r)) return true;
    }
    return false;
}

ObSolution solve_orderbook(const Board& board, int max_units, bool indecomposable) {
    for (const auto& ins : board.instruments) {
        if (ins.legs.size() != board.products.size()) throw std::invalid_argument("instrument " + ins.id + " legs length");
        if (!(ins.bid < ins.ask)) throw std::invalid_argument("instrument " + ins.id + " bid must be below ask");
    }
    Search s{board, max_units, indecomposable, std::vector<int>(board.products.size(), 0), std::vector<int>(board.instruments.size(), 0), {}, 0, {}, {}};
    const std::size_t n = board.instruments.size();
    s.suffix_leg.assign(n + 1, 0);
    s.suffix_max_bid.assign(n + 1, 0.0);
    for (std::size_t i = n; i-- > 0;) {
        // One unit can move the L1 imbalance by at most its total leg size (A+B fixes A and B at once).
        int m = 0;
        for (const int q : board.instruments[i].legs) m += std::abs(q);
        s.suffix_leg[i] = std::max(m, s.suffix_leg[i + 1]);
        // Best cash one unit can add: sell at the bid, or buy at a negative ask (spreads can trade below zero).
        s.suffix_max_bid[i] = std::max({board.instruments[i].bid, -board.instruments[i].ask, s.suffix_max_bid[i + 1]});
    }
    s.dfs(0, 0, 0.0);
    s.best.profit = std::round(s.best.profit * 1e6) / 1e6;
    return s.best;
}

double position_cash(const Board& board, const std::vector<Trade>& trades) {
    double cash = 0;
    for (const auto& t : trades) {
        const auto it = std::find_if(board.instruments.begin(), board.instruments.end(), [&](const Instrument& i) { return i.id == t.id; });
        if (it == board.instruments.end()) throw std::invalid_argument("unknown instrument " + t.id);
        cash += (t.buy ? -it->ask : it->bid) * t.units;
    }
    return std::round(cash * 1e6) / 1e6;
}

bool position_flat(const Board& board, const std::vector<Trade>& trades) {
    std::vector<int> net(board.products.size(), 0);
    for (const auto& t : trades) {
        const auto it = std::find_if(board.instruments.begin(), board.instruments.end(), [&](const Instrument& i) { return i.id == t.id; });
        if (it == board.instruments.end()) throw std::invalid_argument("unknown instrument " + t.id);
        for (std::size_t k = 0; k < net.size(); ++k) net[k] += (t.buy ? 1 : -1) * t.units * it->legs[k];
    }
    return std::all_of(net.begin(), net.end(), [](int x) { return x == 0; });
}

}  // namespace oa
