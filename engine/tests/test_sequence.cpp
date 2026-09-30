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

TEST(Sequence, RecognisesExtendedRules) {
    EXPECT_TRUE(predicts(predict_next(seq({13, 17, 19, 23, 29, 31})), 37));        // consecutive primes
    EXPECT_TRUE(predicts(predict_next(seq({4, -9, 16, -25, 36, -49})), 64));       // alternating signs
    EXPECT_TRUE(predicts(predict_next(seq({16, 18, 21, 26, 33, 44})), 57));        // prime gaps
    EXPECT_TRUE(predicts(predict_next(seq({4, 2, 5, 6, 10, 15})), 24));            // a(n+2) = a(n+1) + a(n) - 1
    EXPECT_TRUE(predicts(predict_next(seq({30, 33, 39, 51, 57, 69})), 84));        // add digit sum
    EXPECT_TRUE(predicts(predict_next(seq({16, 77, 154, 605, 1111})), 2222));      // add reversal
    EXPECT_TRUE(predicts(predict_next(seq({-1, 2, 5, 26, 677})), 458330));         // square plus c
    EXPECT_TRUE(predicts(predict_next(seq({4, 1, 1, 2, -2, 4, -5})), 8));          // mixed interleave
    EXPECT_TRUE(predicts(predict_next(seq({4, 4, 17, 69, 1174, 81007})), 95102219));  // product plus c
    EXPECT_TRUE(predicts(predict_next(seq({4, 5, 17, 54, 177, 583, 1924})), 6353));   // 3a + b - 2
    std::vector<Rational> fr{Rational(4, 3), Rational(7, 5), Rational(10, 7), Rational(13, 9), Rational(16, 11)};
    EXPECT_TRUE(predicts(predict_next(seq({121, 169, 289, 361, 529})), 841));       // prime squares
    EXPECT_TRUE(predicts(predict_next(seq({3, 3, 1, 4, 5, 7, 13})), 22));          // tribonacci - 3
    EXPECT_TRUE(predicts(predict_next(seq({53, 68, 116, 122, 126, 138})), 162));   // add digit product
    EXPECT_TRUE(predicts(predict_next(seq({10, 3, 12, 9, 17, 27, 25})), 81));      // quadratic + geometric strands
    EXPECT_TRUE(predicts(predict_next(seq({1, 2, 5, 16, 65, 326})), 1957));        // a(n)(n+k) + c
    const auto fp = predict_next(fr);
    EXPECT_TRUE(std::any_of(fp.begin(), fp.end(), [](const Prediction& p) { return p.next == Rational(19, 13); }));
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
