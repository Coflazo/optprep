// Throughput benchmarks for the heavy paths, printed as JSON lines so the
// backend can store them next to the JS timings.
#include <chrono>
#include <cstdio>
#include <vector>

#include "oa/montecarlo.hpp"
#include "oa/numberbox.hpp"
#include "oa/orderbook.hpp"
#include "oa/rng.hpp"
#include "oa/tower.hpp"

namespace {
template <class F>
double seconds(F&& f) {
    const auto t0 = std::chrono::steady_clock::now();
    f();
    return std::chrono::duration<double>(std::chrono::steady_clock::now() - t0).count();
}
}  // namespace

int main() {
    using namespace oa;
    {
        const auto s = make_sampler("dice_event", Json::parse(R"({"sums":[11,12]})"));
        const std::uint64_t n = 20'000'000;
        McResult r;
        const double t = seconds([&] { r = run_parallel(s, n, 1); });
        std::printf("{\"bench\":\"monte_carlo_dice\",\"samples\":%llu,\"seconds\":%.4f,\"samples_per_sec\":%.0f,\"mean\":%.6f}\n",
                    static_cast<unsigned long long>(n), t, static_cast<double>(n) / t, r.mean);
    }
    {
        long long solvable = 0, sets = 0;
        const double t = seconds([&] {
            for (int a = 1; a <= 9; ++a) for (int b = a; b <= 9; ++b) for (int c = b; c <= 9; ++c) for (int d = c; d <= 9; ++d) {
                ++sets; solvable += solve_numberbox({a, b, c, d}, Rational(24)).solvable ? 1 : 0;
            }
        });
        std::printf("{\"bench\":\"numberbox_all_24\",\"sets\":%lld,\"solvable\":%lld,\"seconds\":%.4f}\n", sets, solvable, t);
    }
    {
        Rng r(3);
        long long nodes = 0;
        const int boards = 2000;
        const double t = seconds([&] {
            for (int i = 0; i < boards; ++i) {
                Board b{{"A", "B", "C"}, {}};
                const std::vector<std::vector<int>> shapes = {{1, 0, 0}, {0, 1, 0}, {0, 0, 1}, {1, 1, 0}, {0, 1, 1}, {1, 0, -1}, {2, 1, 0}};
                int k = 0;
                for (const auto& legs : shapes) {
                    const double v = 10.0 * legs[0] + 20.0 * legs[1] + 15.0 * legs[2] + (static_cast<double>(r.below(5)) - 2.0) * 0.5;
                    b.instruments.push_back({"I" + std::to_string(k++), legs, v - 0.5, v + 0.5});
                }
                nodes += solve_orderbook(b, 6).nodes;
            }
        });
        std::printf("{\"bench\":\"orderbook_bnb\",\"boards\":%d,\"nodes\":%lld,\"seconds\":%.4f,\"boards_per_sec\":%.0f}\n", boards, nodes, t, boards / t);
    }
    {
        std::size_t levels = 0;
        const double t = seconds([&] { levels = tower_levels({"abcd", "ef", ""}, {4, 4, 4}, 8, 1000, 7).size(); });
        std::printf("{\"bench\":\"tower_levels_depth8\",\"levels\":%zu,\"seconds\":%.4f}\n", levels, t);
    }
    return 0;
}
