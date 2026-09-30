#pragma once
// Exact rational over int64 with 128-bit intermediates. Overflow throws rather
// than silently wrapping, so a solver can never report a wrong exact answer.
#include <compare>
#include <cstdint>
#include <numeric>
#include <stdexcept>
#include <string>

namespace oa {

class Rational {
public:
    constexpr Rational() noexcept = default;
    constexpr Rational(std::int64_t n) noexcept : n_(n) {}  // NOLINT: implicit from integers is intended
    Rational(std::int64_t n, std::int64_t d) { set(static_cast<__int128>(n), static_cast<__int128>(d)); }

    [[nodiscard]] std::int64_t num() const noexcept { return n_; }
    [[nodiscard]] std::int64_t den() const noexcept { return d_; }
    [[nodiscard]] bool is_zero() const noexcept { return n_ == 0; }
    [[nodiscard]] bool is_integer() const noexcept { return d_ == 1; }
    [[nodiscard]] double to_double() const noexcept { return static_cast<double>(n_) / static_cast<double>(d_); }
    [[nodiscard]] std::string str() const { return d_ == 1 ? std::to_string(n_) : std::to_string(n_) + "/" + std::to_string(d_); }

    friend Rational operator+(const Rational& a, const Rational& b) { return from128(static_cast<__int128>(a.n_) * b.d_ + static_cast<__int128>(b.n_) * a.d_, static_cast<__int128>(a.d_) * b.d_); }
    friend Rational operator-(const Rational& a, const Rational& b) { return from128(static_cast<__int128>(a.n_) * b.d_ - static_cast<__int128>(b.n_) * a.d_, static_cast<__int128>(a.d_) * b.d_); }
    friend Rational operator*(const Rational& a, const Rational& b) { return from128(static_cast<__int128>(a.n_) * b.n_, static_cast<__int128>(a.d_) * b.d_); }
    friend Rational operator/(const Rational& a, const Rational& b) {
        if (b.n_ == 0) throw std::domain_error("rational division by zero");
        return from128(static_cast<__int128>(a.n_) * b.d_, static_cast<__int128>(a.d_) * b.n_);
    }
    friend bool operator==(const Rational& a, const Rational& b) noexcept { return a.n_ == b.n_ && a.d_ == b.d_; }
    friend std::strong_ordering operator<=>(const Rational& a, const Rational& b) noexcept {
        const __int128 l = static_cast<__int128>(a.n_) * b.d_;
        const __int128 r = static_cast<__int128>(b.n_) * a.d_;
        return l < r ? std::strong_ordering::less : l > r ? std::strong_ordering::greater : std::strong_ordering::equal;
    }

private:
    static Rational from128(__int128 n, __int128 d) { Rational r; r.set(n, d); return r; }
    void set(__int128 n, __int128 d) {
        if (d == 0) throw std::domain_error("rational with zero denominator");
        if (d < 0) { n = -n; d = -d; }
        __int128 a = n < 0 ? -n : n, b = d;
        while (b != 0) { const __int128 t = a % b; a = b; b = t; }
        const __int128 g = a == 0 ? 1 : a;
        n /= g; d /= g;
        constexpr __int128 lim = static_cast<__int128>(INT64_MAX);
        if (n > lim || n < -lim || d > lim) throw std::overflow_error("rational overflow");
        n_ = static_cast<std::int64_t>(n);
        d_ = static_cast<std::int64_t>(d);
    }
    std::int64_t n_ = 0;
    std::int64_t d_ = 1;
};

}  // namespace oa
