#include "oa/montecarlo.hpp"

#include <algorithm>
#include <cmath>
#include <map>
#include <numeric>
#include <stdexcept>
#include <thread>

namespace oa {

bool McResult::agrees(double expected, double sigmas) const noexcept {
    return std::fabs(mean - expected) <= sigmas * std_error + 1e-9 + 1.0 / static_cast<double>(std::max<std::uint64_t>(samples, 1));
}

namespace {

std::vector<int> ints(const Json& a) {
    std::vector<int> out;
    for (const auto& x : a.arr()) out.push_back(static_cast<int>(x.integer()));
    return out;
}
std::vector<double> dbls(const Json& a) {
    std::vector<double> out;
    for (const auto& x : a.arr()) out.push_back(x.num());
    return out;
}
std::vector<std::vector<double>> matrix(const Json& a) {
    std::vector<std::vector<double>> m;
    for (const auto& row : a.arr()) m.push_back(dbls(row));
    return m;
}
int step(Rng& r, const std::vector<double>& row) {
    double u = r.uniform();
    for (std::size_t j = 0; j < row.size(); ++j) { u -= row[j]; if (u < 0) return static_cast<int>(j); }
    return static_cast<int>(row.size()) - 1;
}
bool compare(long long x, const std::string& cmp, long long k) {
    if (cmp == "ge") return x >= k;
    if (cmp == "gt") return x > k;
    if (cmp == "le") return x <= k;
    if (cmp == "lt") return x < k;
    if (cmp == "eq") return x == k;
    throw std::invalid_argument("unknown comparison " + cmp);
}
double normal(Rng& r) {
    const double u = std::max(r.uniform(), 1e-300), v = r.uniform();
    return std::sqrt(-2.0 * std::log(u)) * std::cos(2.0 * M_PI * v);
}

using Factory = std::function<Sampler(const Json&)>;

const std::map<std::string, Factory>& registry() {
    static const std::map<std::string, Factory> R = {
        // P(sum of `dice` fair `sides`-sided dice lies in `sums`)
        {"dice_event", [](const Json& p) -> Sampler {
            const int n = static_cast<int>(p.int_or("dice", 2)), s = static_cast<int>(p.int_or("sides", 6));
            auto sums = ints(p.at("sums"));
            return [=](Rng& r) { int t = 0; for (int i = 0; i < n; ++i) t += r.die(s); return std::find(sums.begin(), sums.end(), t) != sums.end() ? 1.0 : 0.0; };
        }},
        // P(max of `dice` dice <= k)
        {"dice_max_le", [](const Json& p) -> Sampler {
            const int n = static_cast<int>(p.at("dice").integer()), s = static_cast<int>(p.int_or("sides", 6)), k = static_cast<int>(p.at("k").integer());
            return [=](Rng& r) { int m = 0; for (int i = 0; i < n; ++i) m = std::max(m, r.die(s)); return m <= k ? 1.0 : 0.0; };
        }},
        // P(sum of player A's dice > sum of player B's dice)
        {"dice_duel", [](const Json& p) -> Sampler {
            const int da = static_cast<int>(p.int_or("dice_a", 1)), sa = static_cast<int>(p.int_or("sides_a", 6));
            const int db = static_cast<int>(p.int_or("dice_b", 1)), sb = static_cast<int>(p.int_or("sides_b", 6));
            return [=](Rng& r) { int a = 0, b = 0; for (int i = 0; i < da; ++i) a += r.die(sa); for (int i = 0; i < db; ++i) b += r.die(sb); return a > b ? 1.0 : 0.0; };
        }},
        // P(face `face` appears at least `k` times in `throws` throws)
        {"face_count", [](const Json& p) -> Sampler {
            const int n = static_cast<int>(p.at("throws").integer()), s = static_cast<int>(p.int_or("sides", 6));
            const int face = static_cast<int>(p.int_or("face", 6)), k = static_cast<int>(p.int_or("k", 1));
            return [=](Rng& r) { int c = 0; for (int i = 0; i < n; ++i) c += r.die(s) == face ? 1 : 0; return c >= k ? 1.0 : 0.0; };
        }},
        // P(all `throws` throws show different faces) / P(all the same)
        {"faces_distinct", [](const Json& p) -> Sampler {
            const int n = static_cast<int>(p.at("throws").integer()), s = static_cast<int>(p.int_or("sides", 6));
            const bool same = p.has("same") && p.at("same").boolean();
            return [=](Rng& r) {
                std::vector<int> v(static_cast<std::size_t>(n)); for (auto& x : v) x = r.die(s);
                if (same) return std::all_of(v.begin(), v.end(), [&](int x) { return x == v[0]; }) ? 1.0 : 0.0;
                std::sort(v.begin(), v.end()); return std::adjacent_find(v.begin(), v.end()) == v.end() ? 1.0 : 0.0;
            };
        }},
        // Draw `draws` balls from an urn with `counts` per colour; P(count of `color` cmp k)
        {"urn_count", [](const Json& p) -> Sampler {
            auto counts = ints(p.at("counts"));
            const int draws = static_cast<int>(p.at("draws").integer()), color = static_cast<int>(p.int_or("color", 0)), k = static_cast<int>(p.at("k").integer());
            const bool replace = p.has("replace") && p.at("replace").boolean();
            const std::string cmp = p.has("cmp") ? p.at("cmp").str() : "ge";
            std::vector<int> balls;
            for (std::size_t c = 0; c < counts.size(); ++c) balls.insert(balls.end(), static_cast<std::size_t>(counts[c]), static_cast<int>(c));
            // Samplers run concurrently on one shared object, so each trial works on its own copy.
            return [=](Rng& r) {
                auto deck = balls;
                int hit = 0; const auto n = deck.size();
                for (int d = 0; d < draws; ++d) {
                    if (replace) { hit += deck[r.below(n)] == color ? 1 : 0; continue; }
                    const auto j = static_cast<std::size_t>(d) + r.below(n - static_cast<std::size_t>(d));
                    std::swap(deck[static_cast<std::size_t>(d)], deck[j]);
                    hit += deck[static_cast<std::size_t>(d)] == color ? 1 : 0;
                }
                return compare(hit, cmp, k) ? 1.0 : 0.0;
            };
        }},
        // Shuffle a deck with `red` red cards out of `deck`, discard `discard` unseen; P(next card red)
        {"top_card_after_discard", [](const Json& p) -> Sampler {
            const int deck = static_cast<int>(p.int_or("deck", 52)), red = static_cast<int>(p.int_or("red", 26)), discard = static_cast<int>(p.at("discard").integer());
            return [=](Rng& r) {
                int reds = red, left = deck;
                for (int i = 0; i < discard; ++i) { if (static_cast<int>(r.below(static_cast<std::uint64_t>(left))) < reds) --reds; --left; }
                return static_cast<int>(r.below(static_cast<std::uint64_t>(left))) < reds ? 1.0 : 0.0;
            };
        }},
        // P(a run of at least `run` heads somewhere in `flips` flips)
        {"coin_run", [](const Json& p) -> Sampler {
            const int n = static_cast<int>(p.at("flips").integer()), k = static_cast<int>(p.at("run").integer());
            const double q = p.num_or("p", 0.5);
            return [=](Rng& r) { int cur = 0; for (int i = 0; i < n; ++i) { cur = r.chance(q) ? cur + 1 : 0; if (cur >= k) return 1.0; } return 0.0; };
        }},
        // E[flips until `pattern` (string of H/T) first appears]
        {"pattern_wait", [](const Json& p) -> Sampler {
            const std::string pat = p.at("pattern").str();
            const double q = p.num_or("p", 0.5);
            return [=](Rng& r) { std::string s; long long n = 0; while (true) { s.push_back(r.chance(q) ? 'H' : 'T'); ++n; if (s.size() >= pat.size() && s.compare(s.size() - pat.size(), pat.size(), pat) == 0) return static_cast<double>(n); if (s.size() > 64) s.erase(0, 32); } };
        }},
        // P(at least two of `people` share a birthday among `days`)
        {"birthday", [](const Json& p) -> Sampler {
            const int n = static_cast<int>(p.at("people").integer()), d = static_cast<int>(p.int_or("days", 365));
            return [=](Rng& r) { std::vector<char> seen(static_cast<std::size_t>(d), 0); for (int i = 0; i < n; ++i) { auto& x = seen[r.below(static_cast<std::uint64_t>(d))]; if (x) return 1.0; x = 1; } return 0.0; };
        }},
        // P(random permutation of n has no fixed point); with "fixed": E[number of fixed points]
        {"derangement", [](const Json& p) -> Sampler {
            const int n = static_cast<int>(p.at("n").integer());
            const bool count = p.has("fixed") && p.at("fixed").boolean();
            return [=](Rng& r) {
                std::vector<int> v(static_cast<std::size_t>(n)); std::iota(v.begin(), v.end(), 0);
                for (int i = n - 1; i > 0; --i) std::swap(v[static_cast<std::size_t>(i)], v[r.below(static_cast<std::uint64_t>(i + 1))]);
                int f = 0; for (int i = 0; i < n; ++i) f += v[static_cast<std::size_t>(i)] == i ? 1 : 0;
                return count ? static_cast<double>(f) : (f == 0 ? 1.0 : 0.0);
            };
        }},
        // E[draws to collect all n coupons], optional non-uniform `weights`
        {"coupon", [](const Json& p) -> Sampler {
            const int n = static_cast<int>(p.at("n").integer());
            std::vector<double> w = p.has("weights") ? dbls(p.at("weights")) : std::vector<double>(static_cast<std::size_t>(n), 1.0);
            const double total = std::accumulate(w.begin(), w.end(), 0.0);
            for (auto& x : w) x /= total;
            return [=](Rng& r) { std::vector<char> got(static_cast<std::size_t>(n), 0); int have = 0; long long draws = 0; while (have < n) { ++draws; const int c = step(r, w); if (!got[static_cast<std::size_t>(c)]) { got[static_cast<std::size_t>(c)] = 1; ++have; } } return static_cast<double>(draws); };
        }},
        // E[trials until first success with probability p]
        {"geometric_wait", [](const Json& p) -> Sampler {
            const double q = p.at("p").num();
            return [=](Rng& r) { long long n = 1; while (!r.chance(q)) ++n; return static_cast<double>(n); };
        }},
        // Symmetric walk on an n-cycle: E[steps from start to target]; start == target gives the return time
        {"walk_cycle", [](const Json& p) -> Sampler {
            const int n = static_cast<int>(p.at("n").integer()), s = static_cast<int>(p.int_or("start", 0)), t = static_cast<int>(p.int_or("target", 0));
            return [=](Rng& r) { int x = s; long long k = 0; do { x = (x + (r.chance(0.5) ? 1 : n - 1)) % n; ++k; } while (x != t); return static_cast<double>(k); };
        }},
        // P(reach `target` before 0 from `start`, win prob p per step)
        {"gambler_ruin", [](const Json& p) -> Sampler {
            const int s = static_cast<int>(p.at("start").integer()), t = static_cast<int>(p.at("target").integer());
            const double q = p.num_or("p", 0.5);
            return [=](Rng& r) { int x = s; while (x > 0 && x < t) x += r.chance(q) ? 1 : -1; return x == t ? 1.0 : 0.0; };
        }},
        // Break a stick at two uniform points: P(the three pieces form a triangle)
        {"stick_triangle", [](const Json&) -> Sampler {
            return [](Rng& r) { double a = r.uniform(), b = r.uniform(); if (a > b) std::swap(a, b); const double x = a, y = b - a, z = 1 - b; return (x < 0.5 && y < 0.5 && z < 0.5) ? 1.0 : 0.0; };
        }},
        // P(Binomial(n, p) cmp k)
        {"binomial", [](const Json& p) -> Sampler {
            const int n = static_cast<int>(p.at("n").integer()), k = static_cast<int>(p.at("k").integer());
            const double q = p.at("p").num();
            const std::string cmp = p.has("cmp") ? p.at("cmp").str() : "ge";
            return [=](Rng& r) { int c = 0; for (int i = 0; i < n; ++i) c += r.chance(q) ? 1 : 0; return compare(c, cmp, k) ? 1.0 : 0.0; };
        }},
        // Markov chain: E[steps from start until any of `targets`]
        {"markov_hitting", [](const Json& p) -> Sampler {
            auto m = matrix(p.at("matrix"));
            const int s = static_cast<int>(p.at("start").integer());
            auto targets = ints(p.at("targets"));
            return [=](Rng& r) { int x = s; long long k = 0; while (std::find(targets.begin(), targets.end(), x) == targets.end()) { x = step(r, m[static_cast<std::size_t>(x)]); ++k; if (k > 10'000'000) break; } return static_cast<double>(k); };
        }},
        // Markov chain: P(state after `steps` steps == `state`) — approximates the stationary probability
        {"markov_state", [](const Json& p) -> Sampler {
            auto m = matrix(p.at("matrix"));
            const int s = static_cast<int>(p.int_or("start", 0)), target = static_cast<int>(p.at("state").integer()), steps = static_cast<int>(p.int_or("steps", 200));
            return [=](Rng& r) { int x = s; for (int i = 0; i < steps; ++i) x = step(r, m[static_cast<std::size_t>(x)]); return x == target ? 1.0 : 0.0; };
        }},
        // P(lo < Normal(mu, sd) < hi)
        {"normal_between", [](const Json& p) -> Sampler {
            const double mu = p.at("mu").num(), sd = p.at("sd").num();
            const double lo = p.has("lo") ? p.at("lo").num() : -1e300, hi = p.has("hi") ? p.at("hi").num() : 1e300;
            return [=](Rng& r) { const double x = mu + sd * normal(r); return (x > lo && x < hi) ? 1.0 : 0.0; };
        }},
        // Place `coins` uniformly into `boxes`: P(some box holds more than `threshold`)
        {"pigeonhole", [](const Json& p) -> Sampler {
            const int c = static_cast<int>(p.at("coins").integer()), b = static_cast<int>(p.at("boxes").integer()), t = static_cast<int>(p.at("threshold").integer());
            return [=](Rng& r) { std::vector<int> v(static_cast<std::size_t>(b), 0); for (int i = 0; i < c; ++i) ++v[r.below(static_cast<std::uint64_t>(b))]; return *std::max_element(v.begin(), v.end()) > t ? 1.0 : 0.0; };
        }},
        // E[number of throws of a fair die until the first `face`] (die-flavoured geometric)
        {"die_wait", [](const Json& p) -> Sampler {
            const int s = static_cast<int>(p.int_or("sides", 6)), f = static_cast<int>(p.int_or("face", 6));
            return [=](Rng& r) { long long n = 1; while (r.die(s) != f) ++n; return static_cast<double>(n); };
        }},
    };
    return R;
}

}  // namespace

Sampler make_sampler(const std::string& model, const Json& params) {
    const auto& R = registry();
    const auto it = R.find(model);
    if (it == R.end()) throw std::invalid_argument("unknown Monte Carlo model: " + model);
    return it->second(params);
}

std::vector<std::string> model_names() {
    std::vector<std::string> out;
    for (const auto& [k, v] : registry()) out.push_back(k);
    return out;
}

McResult run_parallel(const Sampler& sampler, std::uint64_t samples, std::uint64_t seed, unsigned threads) {
    if (threads == 0) threads = std::max(1u, std::thread::hardware_concurrency());
    threads = static_cast<unsigned>(std::min<std::uint64_t>(threads, std::max<std::uint64_t>(samples, 1)));
    std::vector<double> sums(threads, 0.0), sq(threads, 0.0);
    std::vector<std::uint64_t> counts(threads, 0);
    std::vector<std::thread> pool;
    Rng base(seed);
    for (unsigned t = 0; t < threads; ++t) {
        const std::uint64_t n = samples / threads + (t < samples % threads ? 1 : 0);
        pool.emplace_back([&, t, n, rng = base]() mutable {
            for (unsigned j = 0; j < t; ++j) rng.jump();  // independent stream per worker
            double s = 0, s2 = 0;
            for (std::uint64_t i = 0; i < n; ++i) { const double x = sampler(rng); s += x; s2 += x * x; }
            sums[t] = s; sq[t] = s2; counts[t] = n;
        });
    }
    for (auto& th : pool) th.join();
    const double n = static_cast<double>(std::accumulate(counts.begin(), counts.end(), std::uint64_t{0}));
    const double mean = std::accumulate(sums.begin(), sums.end(), 0.0) / n;
    const double var = std::max(0.0, std::accumulate(sq.begin(), sq.end(), 0.0) / n - mean * mean);
    return {mean, std::sqrt(var / n), static_cast<std::uint64_t>(n)};
}

}  // namespace oa
