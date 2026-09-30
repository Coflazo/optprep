#include "oa/sequence.hpp"

#include <algorithm>
#include <cmath>
#include <functional>
#include <map>
#include <optional>

namespace oa {

Rational rational_from_double(double x, long long max_den) {
    // Continued-fraction best approximation.
    long long h0 = 0, h1 = 1, k0 = 1, k1 = 0;
    double v = x;
    for (int i = 0; i < 40; ++i) {
        const double a = std::floor(v);
        const long long ai = static_cast<long long>(a);
        const long long h2 = ai * h1 + h0, k2 = ai * k1 + k0;
        if (k2 > max_den) break;
        h0 = h1; h1 = h2; k0 = k1; k1 = k2;
        if (std::fabs(static_cast<double>(h1) / static_cast<double>(k1) - x) < 1e-12 || v - a < 1e-12) break;
        v = 1.0 / (v - a);
    }
    return Rational(h1, k1);
}

namespace {

using Seq = std::vector<Rational>;
using Rule = std::function<std::optional<Rational>(const Seq&)>;

bool all_equal(const Seq& s) { return std::all_of(s.begin(), s.end(), [&](const Rational& x) { return x == s[0]; }); }
Seq diffs(const Seq& s) { Seq d; for (std::size_t i = 1; i < s.size(); ++i) d.push_back(s[i] - s[i - 1]); return d; }

// Polynomial of degree `deg`: the deg-th differences are constant.
std::optional<Rational> poly(const Seq& s, int deg) {
    std::vector<Seq> levels{s};
    for (int d = 0; d < deg; ++d) levels.push_back(diffs(levels.back()));
    if (levels.back().size() < 2 || !all_equal(levels.back())) return std::nullopt;
    Rational carry = levels.back().back();
    for (int d = deg - 1; d >= 0; --d) carry = levels[static_cast<std::size_t>(d)].back() + carry;
    return carry;
}

std::optional<Rational> geometric(const Seq& s) {
    if (s.size() < 3 || s[0].is_zero()) return std::nullopt;
    const Rational r = s[1] / s[0];
    for (std::size_t i = 1; i + 1 < s.size(); ++i) { if (s[i].is_zero() || !(s[i + 1] / s[i] == r)) return std::nullopt; }
    return s.back() * r;
}

// a(n+1) = r a(n) + c
std::optional<Rational> affine(const Seq& s) {
    if (s.size() < 4 || s[1] == s[0]) return std::nullopt;
    const Rational r = (s[2] - s[1]) / (s[1] - s[0]);
    const Rational c = s[1] - r * s[0];
    for (std::size_t i = 0; i + 1 < s.size(); ++i) if (!(s[i + 1] == r * s[i] + c)) return std::nullopt;
    return r * s.back() + c;
}

// a(n+2) = p a(n+1) + q a(n)
std::optional<Rational> linear2(const Seq& s) {
    if (s.size() < 5) return std::nullopt;
    const Rational det = s[1] * s[1] - s[0] * s[2];
    if (det.is_zero()) return std::nullopt;
    const Rational p = (s[2] * s[1] - s[0] * s[3]) / det;
    const Rational q = (s[1] * s[3] - s[2] * s[2]) / det;
    for (std::size_t i = 0; i + 2 < s.size(); ++i) if (!(s[i + 2] == p * s[i + 1] + q * s[i])) return std::nullopt;
    return p * s.back() + q * s[s.size() - 2];
}

std::optional<Rational> product2(const Seq& s) {
    if (s.size() < 4) return std::nullopt;
    for (std::size_t i = 0; i + 2 < s.size(); ++i) if (!(s[i + 2] == s[i + 1] * s[i])) return std::nullopt;
    return s.back() * s[s.size() - 2];
}

std::optional<Rational> sum_prev3(const Seq& s) {
    if (s.size() < 5) return std::nullopt;
    for (std::size_t i = 0; i + 3 < s.size(); ++i) if (!(s[i + 3] == s[i + 2] + s[i + 1] + s[i])) return std::nullopt;
    return s.back() + s[s.size() - 2] + s[s.size() - 3];
}

// a(n+1) = a(n) * (n + k) for a constant k (factorial-like growth)
std::optional<Rational> times_index(const Seq& s) {
    if (s.size() < 4 || s[0].is_zero()) return std::nullopt;
    const Rational k = s[1] / s[0];
    for (std::size_t i = 0; i + 1 < s.size(); ++i) if (s[i].is_zero() || !(s[i + 1] / s[i] == k + Rational(static_cast<std::int64_t>(i)))) return std::nullopt;
    return s.back() * (k + Rational(static_cast<std::int64_t>(s.size() - 1)));
}

// Differences form a geometric sequence.
std::optional<Rational> diff_geometric(const Seq& s) {
    const Seq d = diffs(s);
    if (d.size() < 3) return std::nullopt;
    const auto g = geometric(d);
    if (!g) return std::nullopt;
    return s.back() + *g;
}

// Odd and even positions are two separate simple sequences.
std::optional<Rational> interleave(const Seq& s) {
    if (s.size() < 6) return std::nullopt;
    Seq odd, even;
    for (std::size_t i = 0; i < s.size(); ++i) (i % 2 == 0 ? even : odd).push_back(s[i]);
    const Seq& nxt = s.size() % 2 == 0 ? even : odd;
    for (const auto& f : {std::function<std::optional<Rational>(const Seq&)>([](const Seq& x) { return poly(x, 1); }),
                          std::function<std::optional<Rational>(const Seq&)>(geometric)}) {
        const auto a = f(even), b = f(odd);
        if (a && b) { const auto v = f(nxt); if (v) return v; }
    }
    return std::nullopt;
}

// Alternating operations: +p then ×q (or ×q then +p).
std::optional<Rational> alternating(const Seq& s) {
    if (s.size() < 5) return std::nullopt;
    for (int start = 0; start < 2; ++start) {
        // step i uses op (i + start) % 2: 0 = add, 1 = multiply
        std::optional<Rational> add, mul;
        bool ok = true;
        for (std::size_t i = 0; i + 1 < s.size() && ok; ++i) {
            if ((i + static_cast<std::size_t>(start)) % 2 == 0) {
                const Rational a = s[i + 1] - s[i];
                if (!add) add = a; else ok = *add == a;
            } else {
                if (s[i].is_zero()) { ok = false; break; }
                const Rational m = s[i + 1] / s[i];
                if (!mul) mul = m; else ok = *mul == m;
            }
        }
        if (!ok || !add || !mul || *mul == Rational(1) || add->is_zero()) continue;
        const std::size_t i = s.size() - 1;
        return (i + static_cast<std::size_t>(start)) % 2 == 0 ? s.back() + *add : s.back() * *mul;
    }
    return std::nullopt;
}

// Known sequences, shifted by an index offset, then scaled and translated: a(n) = m * f(n + o) + c.
std::vector<long long> known(const std::string& name, std::size_t count) {
    std::vector<long long> out;
    if (name == "primes") { for (long long x = 2; out.size() < count; ++x) { bool p = true; for (long long d = 2; d * d <= x; ++d) if (x % d == 0) { p = false; break; } if (p) out.push_back(x); } return out; }
    if (name == "fibonacci") { long long a = 1, b = 1; while (out.size() < count) { out.push_back(a); const long long t = a + b; a = b; b = t; } return out; }
    for (long long n = 1; out.size() < count; ++n) {
        if (name == "squares") out.push_back(n * n);
        else if (name == "cubes") out.push_back(n * n * n);
        else if (name == "triangular") out.push_back(n * (n + 1) / 2);
        else if (name == "pow2") out.push_back(1LL << std::min<long long>(n, 60));
        else if (name == "pow3") { long long v = 1; for (long long k = 0; k < n; ++k) v *= 3; out.push_back(v); }
        else if (name == "factorial") { long long v = 1; for (long long k = 2; k <= n && v < (1LL << 60) / 20; ++k) v *= k; out.push_back(v); }
    }
    return out;
}

std::optional<Rational> known_fit(const Seq& s, const std::string& name, int offset) {
    if (s.size() < 4) return std::nullopt;
    const auto f = known(name, s.size() + static_cast<std::size_t>(offset) + 2);
    auto F = [&](std::size_t i) { return Rational(f[i + static_cast<std::size_t>(offset)]); };
    if (F(1) == F(0)) return std::nullopt;
    const Rational m = (s[1] - s[0]) / (F(1) - F(0));
    const Rational c = s[0] - m * F(0);
    if (m.is_zero()) return std::nullopt;
    for (std::size_t i = 0; i < s.size(); ++i) if (!(s[i] == m * F(i) + c)) return std::nullopt;
    return m * F(s.size()) + c;
}

}  // namespace

std::vector<Prediction> predict_next(const std::vector<Rational>& terms) {
    std::vector<Prediction> out;
    auto add = [&](const std::string& rule, int complexity, const std::function<std::optional<Rational>()>& f) {
        try { if (const auto v = f()) out.push_back({rule, *v, complexity}); } catch (const std::exception&) { /* rational overflow: rule does not apply */ }
    };
    add("arithmetic", 1, [&] { return poly(terms, 1); });
    add("geometric", 1, [&] { return geometric(terms); });
    add("second differences constant", 2, [&] { return poly(terms, 2); });
    add("affine recurrence a(n+1) = r a(n) + c", 2, [&] { return affine(terms); });
    add("product of previous two", 2, [&] { return product2(terms); });
    add("multiply by increasing integers", 2, [&] { return times_index(terms); });
    add("differences geometric", 2, [&] { return diff_geometric(terms); });
    for (const std::string name : {"squares", "cubes", "primes", "fibonacci", "triangular", "pow2", "pow3", "factorial"})
        for (int o = 0; o <= 3; ++o) add(name + " (offset " + std::to_string(o) + ") scaled and shifted", 2 + (o > 0 ? 1 : 0), [&] { return known_fit(terms, name, o); });
    add("third differences constant", 3, [&] { return poly(terms, 3); });
    add("linear recurrence a(n+2) = p a(n+1) + q a(n)", 3, [&] { return linear2(terms); });
    add("sum of previous three", 3, [&] { return sum_prev3(terms); });
    add("two interleaved sequences", 3, [&] { return interleave(terms); });
    add("alternating add and multiply", 3, [&] { return alternating(terms); });
    std::sort(out.begin(), out.end(), [](const Prediction& a, const Prediction& b) { return a.complexity < b.complexity; });
    return out;
}

}  // namespace oa
