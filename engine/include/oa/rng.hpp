#pragma once
// xoshiro256** seeded through splitmix64. Each Monte Carlo worker gets its own
// stream via jump(), so parallel runs are independent and reproducible.
#include <array>
#include <cstdint>

namespace oa {

class Rng {
public:
    explicit Rng(std::uint64_t seed) noexcept {
        for (auto& w : s_) w = splitmix(seed);
    }
    std::uint64_t next() noexcept {
        const std::uint64_t result = rotl(s_[1] * 5, 7) * 9;
        const std::uint64_t t = s_[1] << 17;
        s_[2] ^= s_[0]; s_[3] ^= s_[1]; s_[1] ^= s_[2]; s_[0] ^= s_[3];
        s_[2] ^= t; s_[3] = rotl(s_[3], 45);
        return result;
    }
    // Uniform double in [0, 1) from the top 53 bits.
    double uniform() noexcept { return static_cast<double>(next() >> 11) * 0x1.0p-53; }
    // Uniform integer in [0, n) without modulo bias (Lemire).
    std::uint64_t below(std::uint64_t n) noexcept {
        std::uint64_t x = next();
        __uint128_t m = static_cast<__uint128_t>(x) * n;
        auto l = static_cast<std::uint64_t>(m);
        if (l < n) {
            const std::uint64_t t = (0 - n) % n;
            while (l < t) { x = next(); m = static_cast<__uint128_t>(x) * n; l = static_cast<std::uint64_t>(m); }
        }
        return static_cast<std::uint64_t>(m >> 64);
    }
    int die(int sides) noexcept { return 1 + static_cast<int>(below(static_cast<std::uint64_t>(sides))); }
    bool chance(double p) noexcept { return uniform() < p; }
    // Advance 2^128 steps: the standard xoshiro256 jump for parallel streams.
    void jump() noexcept {
        constexpr std::array<std::uint64_t, 4> J{0x180ec6d33cfd0abaULL, 0xd5a61266f0c9392cULL, 0xa9582618e03fc9aaULL, 0x39abdc4529b1661cULL};
        std::array<std::uint64_t, 4> t{};
        for (const auto j : J)
            for (int b = 0; b < 64; ++b) {
                if (j & (std::uint64_t{1} << b)) for (int i = 0; i < 4; ++i) t[static_cast<std::size_t>(i)] ^= s_[static_cast<std::size_t>(i)];
                next();
            }
        s_ = t;
    }

private:
    static std::uint64_t rotl(std::uint64_t x, int k) noexcept { return (x << k) | (x >> (64 - k)); }
    static std::uint64_t splitmix(std::uint64_t& x) noexcept {
        std::uint64_t z = (x += 0x9e3779b97f4a7c15ULL);
        z = (z ^ (z >> 30)) * 0xbf58476d1ce4e5b9ULL;
        z = (z ^ (z >> 27)) * 0x94d049bb133111ebULL;
        return z ^ (z >> 31);
    }
    std::array<std::uint64_t, 4> s_{};
};

}  // namespace oa
