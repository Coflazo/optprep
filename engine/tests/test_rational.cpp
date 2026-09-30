#include <gtest/gtest.h>
#include "oa/rational.hpp"

using oa::Rational;

TEST(Rational, NormalisesAndComputesExactly) {
    EXPECT_EQ(Rational(2, -4), Rational(-1, 2));
    EXPECT_EQ(Rational(1, 3) + Rational(1, 6), Rational(1, 2));
    EXPECT_EQ(Rational(2, 3) * Rational(3, 4), Rational(1, 2));
    EXPECT_EQ(Rational(1, 2) / Rational(1, 4), Rational(2));
    EXPECT_LT(Rational(1, 3), Rational(1, 2));
    EXPECT_EQ(Rational(7, 3).str(), "7/3");
}

TEST(Rational, ThrowsOnDivisionByZeroAndOverflow) {
    EXPECT_THROW(Rational(1) / Rational(0), std::domain_error);
    const Rational big(INT64_MAX / 2);
    EXPECT_THROW(big * big, std::overflow_error);
}
