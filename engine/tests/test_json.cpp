#include <gtest/gtest.h>
#include "oa/json.hpp"

using oa::Json;

TEST(Json, RoundTripsNestedValues) {
    const auto j = Json::parse(R"({"a":[1,2.5,-3e2],"b":{"c":"x\"y\n"},"t":true,"n":null})");
    EXPECT_EQ(j.at("a").arr().size(), 3u);
    EXPECT_DOUBLE_EQ(j.at("a").arr()[1].num(), 2.5);
    EXPECT_DOUBLE_EQ(j.at("a").arr()[2].num(), -300.0);
    EXPECT_EQ(j.at("b").at("c").str(), "x\"y\n");
    EXPECT_TRUE(j.at("t").boolean());
    EXPECT_TRUE(j.at("n").is_null());
    EXPECT_EQ(Json::parse(j.dump()).dump(), j.dump());
}

TEST(Json, RejectsMalformedInput) {
    EXPECT_THROW(Json::parse("{\"a\":}"), std::runtime_error);
    EXPECT_THROW(Json::parse("[1,2"), std::runtime_error);
    EXPECT_THROW(Json::parse("{} x"), std::runtime_error);
}

TEST(Json, IntegersDumpWithoutDecimals) {
    EXPECT_EQ(Json(Json::Array{Json(3), Json(0.25)}).dump(), "[3,0.25]");
    EXPECT_EQ(Json::parse("\"\\u00e9\"").str(), "\xc3\xa9");
}
