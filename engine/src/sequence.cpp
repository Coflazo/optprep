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
    if (name == "fibonacci" || name == "fib_sq" || name == "fib_prod") {
        long long a = 1, b = 1;
        while (out.size() < count) {
            out.push_back(name == "fibonacci" ? a : name == "fib_sq" ? a * a : a * b);
            const long long t = a + b; a = b; b = t;
        }
        return out;
    }
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


long long digit_sum(long long x) { x = x < 0 ? -x : x; long long s = 0; while (x) { s += x % 10; x /= 10; } return s; }
long long reverse_digits(long long x) { const bool neg = x < 0; x = neg ? -x : x; long long r = 0; while (x) { r = r * 10 + x % 10; x /= 10; } return neg ? -r : r; }

// a(n+1) = a(n) + f(a(n)) for an integer map f
std::optional<Rational> self_map(const Seq& s, long long (*f)(long long)) {
    if (s.size() < 4 || !std::all_of(s.begin(), s.end(), [](const Rational& x) { return x.is_integer(); })) return std::nullopt;
    for (std::size_t i = 0; i + 1 < s.size(); ++i) if (s[i + 1].num() != s[i].num() + f(s[i].num())) return std::nullopt;
    return Rational(s.back().num() + f(s.back().num()));
}

// a(n+1) = a(n)^2 + c
std::optional<Rational> square_plus(const Seq& s) {
    if (s.size() < 4) return std::nullopt;
    const Rational c = s[1] - s[0] * s[0];
    for (std::size_t i = 0; i + 1 < s.size(); ++i) if (!(s[i + 1] == s[i] * s[i] + c)) return std::nullopt;
    return s.back() * s.back() + c;
}

// a(n+2) = a(n+1) * a(n) + c
std::optional<Rational> product_plus(const Seq& s) {
    if (s.size() < 4) return std::nullopt;
    const Rational c = s[2] - s[1] * s[0];
    for (std::size_t i = 0; i + 2 < s.size(); ++i) if (!(s[i + 2] == s[i + 1] * s[i] + c)) return std::nullopt;
    return s.back() * s[s.size() - 2] + c;
}

// a(n+2) = p a(n+1) + q a(n) + c  (needs six terms to fit three unknowns and check)
std::optional<Rational> linear2c(const Seq& s) {
    if (s.size() < 6) return std::nullopt;
    // unknowns p, q, c from rows i = 0, 1, 2: s[i+2] = p s[i+1] + q s[i] + c
    Rational m[3][4];
    for (int r = 0; r < 3; ++r) { m[r][0] = s[static_cast<std::size_t>(r) + 1]; m[r][1] = s[static_cast<std::size_t>(r)]; m[r][2] = Rational(1); m[r][3] = s[static_cast<std::size_t>(r) + 2]; }
    for (int c = 0; c < 3; ++c) {
        int piv = c;
        while (piv < 3 && m[piv][c].is_zero()) ++piv;
        if (piv == 3) return std::nullopt;
        for (int k = 0; k < 4; ++k) std::swap(m[c][k], m[piv][k]);
        for (int r = 0; r < 3; ++r) {
            if (r == c || m[r][c].is_zero()) continue;
            const Rational f = m[r][c] / m[c][c];
            for (int k = c; k < 4; ++k) m[r][k] = m[r][k] - f * m[c][k];
        }
    }
    const Rational p = m[0][3] / m[0][0], q = m[1][3] / m[1][1], c = m[2][3] / m[2][2];
    for (std::size_t i = 0; i + 2 < s.size(); ++i) if (!(s[i + 2] == p * s[i + 1] + q * s[i] + c)) return std::nullopt;
    return p * s.back() + q * s[s.size() - 2] + c;
}

// Consecutive primes from any starting prime (up to the 60th).
std::optional<Rational> consecutive_primes(const Seq& s) {
    if (s.size() < 4 || !std::all_of(s.begin(), s.end(), [](const Rational& x) { return x.is_integer(); })) return std::nullopt;
    std::vector<long long> pr;
    for (long long x = 2; pr.size() < 80; ++x) { bool p = true; for (long long d = 2; d * d <= x; ++d) if (x % d == 0) { p = false; break; } if (p) pr.push_back(x); }
    for (std::size_t o = 0; o + s.size() < pr.size(); ++o) {
        bool ok = true;
        for (std::size_t i = 0; i < s.size() && ok; ++i) ok = s[i].num() == pr[o + i];
        if (ok) return Rational(pr[o + s.size()]);
    }
    return std::nullopt;
}

// Differences are consecutive primes.
std::optional<Rational> prime_gaps(const Seq& s) {
    const auto p = consecutive_primes(diffs(s));
    if (!p) return std::nullopt;
    return s.back() + *p;
}

// Signs alternate and the absolute values follow a simple rule (arithmetic, square-like or geometric).
std::optional<Rational> alternating_signs(const Seq& s) {
    if (s.size() < 4) return std::nullopt;
    Seq a;
    for (std::size_t i = 0; i < s.size(); ++i) {
        if (s[i].is_zero()) return std::nullopt;
        if (i > 0 && ((s[i] < Rational(0)) == (s[i - 1] < Rational(0)))) return std::nullopt;
        a.push_back(s[i] < Rational(0) ? Rational(0) - s[i] : s[i]);
    }
    std::optional<Rational> nxt;
    for (int d = 1; d <= 3 && !nxt; ++d) nxt = poly(a, d);
    if (!nxt) nxt = geometric(a);
    if (!nxt) return std::nullopt;
    return s.back() < Rational(0) ? *nxt : Rational(0) - *nxt;
}

// Fractions whose numerators and denominators each follow a simple rule.
std::optional<Rational> strand(const Seq& t);
std::optional<Rational> strand_fn(const Seq& t) { return strand(t); }
std::optional<Rational> num_den(const Seq& s) {
    if (s.size() < 4 || std::all_of(s.begin(), s.end(), [](const Rational& x) { return x.is_integer(); })) return std::nullopt;
    Seq n, d;
    for (const auto& x : s) { n.emplace_back(x.num()); d.emplace_back(x.den()); }
    const auto a = strand_fn(n), b = strand_fn(d);
    if (!a || !b || b->is_zero()) return std::nullopt;
    return *a / *b;
}

// Two interleaved strands, each arithmetic or geometric on its own.
std::optional<Rational> interleave_mixed(const Seq& s) {
    if (s.size() < 5) return std::nullopt;
    Seq even, odd;
    for (std::size_t i = 0; i < s.size(); ++i) (i % 2 == 0 ? even : odd).push_back(s[i]);
    const auto e = strand_fn(even), o = strand_fn(odd);
    if (!e || !o) return std::nullopt;
    return s.size() % 2 == 0 ? e : o;
}

long long digit_product(long long x) { x = x < 0 ? -x : x; if (x == 0) return 0; long long p = 1; while (x) { p *= x % 10; x /= 10; } return p; }

// Squares of consecutive primes.
std::optional<Rational> prime_squares(const Seq& s) {
    Seq r;
    for (const auto& x : s) {
        if (!x.is_integer() || x.num() < 4) return std::nullopt;
        const auto q = static_cast<long long>(std::llround(std::sqrt(static_cast<double>(x.num()))));
        if (q * q != x.num()) return std::nullopt;
        r.emplace_back(q);
    }
    const auto p = consecutive_primes(r);
    if (!p) return std::nullopt;
    return *p * *p;
}

// a(n+3) = a(n+2) + a(n+1) + a(n) + c
std::optional<Rational> sum_prev3c(const Seq& s) {
    if (s.size() < 5) return std::nullopt;
    const Rational c = s[3] - s[2] - s[1] - s[0];
    for (std::size_t i = 0; i + 3 < s.size(); ++i) if (!(s[i + 3] == s[i + 2] + s[i + 1] + s[i] + c)) return std::nullopt;
    return s.back() + s[s.size() - 2] + s[s.size() - 3] + c;
}

// a(n+1) = a(n) * (n + k) + c, index n counted from 0
std::optional<Rational> times_index_plus(const Seq& s) {
    if (s.size() < 4) return std::nullopt;
    for (long long k = -2; k <= 4; ++k) {
        const Rational c = s[1] - s[0] * Rational(k);
        bool ok = true;
        for (std::size_t i = 0; i + 1 < s.size() && ok; ++i) ok = s[i + 1] == s[i] * Rational(static_cast<long long>(i) + k) + c;
        if (ok) return s.back() * Rational(static_cast<long long>(s.size() - 1) + k) + c;
    }
    return std::nullopt;
}

// A single strand: arithmetic, quadratic, geometric, a known sequence window, or two terms read as arithmetic.
std::optional<Rational> strand(const Seq& t) {
    if (t.size() < 2) return std::nullopt;
    if (t.size() == 2) return t[1] + (t[1] - t[0]);
    for (int d = 1; d <= 2; ++d) if (const auto v = poly(t, d)) return v;
    if (const auto v = geometric(t)) return v;
    if (const auto v = consecutive_primes(t)) return v;
    for (const std::string name : {"squares", "cubes", "primes", "triangular"})
        for (int o = 0; o <= 8; ++o) if (t.size() >= 3) { if (const auto v = known_fit(t, name, o)) return v; }
    return std::nullopt;
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
    for (const std::string name : {"squares", "cubes", "primes", "fibonacci", "fib_sq", "fib_prod", "triangular", "pow2", "pow3", "factorial"})
        for (int o = 0; o <= 8; ++o) add(name + " (offset " + std::to_string(o) + ") scaled and shifted", 2 + (o > 0 ? 1 : 0), [&] { return known_fit(terms, name, o); });
    add("third differences constant", 3, [&] { return poly(terms, 3); });
    add("linear recurrence a(n+2) = p a(n+1) + q a(n)", 3, [&] { return linear2(terms); });
    add("sum of previous three", 3, [&] { return sum_prev3(terms); });
    add("two interleaved sequences", 3, [&] { return interleave(terms); });
    add("alternating add and multiply", 3, [&] { return alternating(terms); });
    add("consecutive primes", 2, [&] { return consecutive_primes(terms); });
    add("a(n+1) = a(n)^2 + c", 2, [&] { return square_plus(terms); });
    add("add the digit sum", 3, [&] { return self_map(terms, digit_sum); });
    add("add the reversed number", 3, [&] { return self_map(terms, reverse_digits); });
    add("differences are consecutive primes", 3, [&] { return prime_gaps(terms); });
    add("alternating signs", 3, [&] { return alternating_signs(terms); });
    add("product of previous two plus c", 3, [&] { return product_plus(terms); });
    add("numerators and denominators separately", 3, [&] { return num_den(terms); });
    add("two interleaved strands (mixed)", 3, [&] { return interleave_mixed(terms); });
    add("a(n+2) = p a(n+1) + q a(n) + c", 4, [&] { return linear2c(terms); });
    add("squares of consecutive primes", 3, [&] { return prime_squares(terms); });
    add("sum of previous three plus c", 4, [&] { return sum_prev3c(terms); });
    add("add the digit product", 3, [&] { return self_map(terms, digit_product); });
    add("a(n+1) = a(n)(n + k) + c", 3, [&] { return times_index_plus(terms); });
    std::sort(out.begin(), out.end(), [](const Prediction& a, const Prediction& b) { return a.complexity < b.complexity; });
    return out;
}

}  // namespace oa
