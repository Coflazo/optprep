#include <gtest/gtest.h>
#include "oa/sequence.hpp"

using namespace oa;

namespace {
std::vector<Rational> seq(std::initializer_list<long long> xs) { std::vector<Rational> v; for (auto x : xs) v.emplace_back(x); return v; }
bool predicts(const std::vector<Prediction>& ps, long long value) {
    return std::any_of(ps.begin(), ps.end(), [&](const Prediction& p) { return p.next == Rational(value); });
}
Prediction simplest(const std::vector<Prediction>& ps) { return ps.front(); }
}  // namespace

TEST(Sequence, RecognisesCoreRules) {
    EXPECT_EQ(simplest(predict_next(seq({3, 7, 11, 15, 19}))).next, Rational(23));
    EXPECT_EQ(simplest(predict_next(seq({2, 6, 18, 54, 162}))).next, Rational(486));
    EXPECT_TRUE(predicts(predict_next(seq({2, 6, 12, 20, 30})), 42));          // n(n+1)
    EXPECT_TRUE(predicts(predict_next(seq({1, 1, 2, 3, 5, 8})), 13));          // Fibonacci
    EXPECT_TRUE(predicts(predict_next(seq({2, 3, 5, 7, 11, 13})), 17));        // primes
    EXPECT_TRUE(predicts(predict_next(seq({1, 2, 6, 24, 120})), 720));         // factorial-like
    EXPECT_TRUE(predicts(predict_next(seq({2, 5, 12, 29, 70})), 169));         // a(n+2) = 2a(n+1) + a(n)
    EXPECT_TRUE(predicts(predict_next(seq({3, 6, 8, 16, 18, 36})), 38));       // +... x2 alternating
    EXPECT_TRUE(predicts(predict_next(seq({1, 10, 3, 20, 5, 30})), 7));        // interleaved
    EXPECT_TRUE(predicts(predict_next(seq({2, 3, 6, 18, 108})), 1944));        // product of previous two
}

TEST(Sequence, ShortSequencesStillPredict) {
    // Only three terms: geometric still applies; longer rules need more evidence.
    const auto ps = predict_next(seq({1, 2, 4}));
    EXPECT_TRUE(predicts(ps, 8));
}

TEST(Sequence, ConvertsDecimals) {
    EXPECT_EQ(rational_from_double(0.125), Rational(1, 8));
    EXPECT_EQ(rational_from_double(2.5), Rational(5, 2));
}
