#include <gtest/gtest.h>
#include "oa/commands.hpp"

using oa::Json;

TEST(Commands, RoundTripThroughJson) {
    const auto r = oa::dispatch(Json::parse(R"({"cmd":"orderbook","board":{"products":["A","B"],"instruments":[
        {"id":"A","legs":[1,0],"bid":10,"ask":11},{"id":"B","legs":[0,1],"bid":20,"ask":21},{"id":"AB","legs":[1,1],"bid":33,"ask":34}]},"maxUnits":3})"));
    ASSERT_TRUE(r.at("ok").boolean());
    EXPECT_DOUBLE_EQ(r.at("profit").num(), 1.0);
    const auto nb = oa::dispatch(Json::parse(R"({"cmd":"numberbox","numbers":[3,3,8,8],"target":24})"));
    EXPECT_TRUE(nb.at("solvable").boolean());
    const auto ev = oa::dispatch(Json::parse(R"({"cmd":"numberbox_eval","expression":")" + nb.at("expression").str() + R"("})"));
    EXPECT_EQ(ev.at("value").str(), "24");
}

TEST(Commands, ErrorsComeBackAsJson) {
    const auto r = oa::dispatch(Json::parse(R"({"cmd":"nope"})"));
    EXPECT_FALSE(r.at("ok").boolean());
    EXPECT_NE(r.at("error").str().find("unknown command"), std::string::npos);
    const auto bad = oa::dispatch(Json::parse(R"({"cmd":"mc","model":"dice_event"})"));
    EXPECT_FALSE(bad.at("ok").boolean());
}
