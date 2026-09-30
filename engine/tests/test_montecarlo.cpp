#include <gtest/gtest.h>
#include "oa/montecarlo.hpp"

using oa::Json;

namespace {
oa::McResult run(const std::string& model, const std::string& params, std::uint64_t n = 400'000) {
    return oa::run_parallel(oa::make_sampler(model, Json::parse(params)), n, 12345);
}
}  // namespace

// Known closed forms: each model must agree within 4 standard errors.
TEST(MonteCarlo, DiceAndCardsMatchClosedForms) {
    EXPECT_TRUE(run("dice_event", R"({"dice":2,"sides":6,"sums":[11,12]})").agrees(3.0 / 36));
    EXPECT_TRUE(run("face_count", R"({"throws":4,"face":6,"k":1})").agrees(1 - 625.0 / 1296));
    EXPECT_TRUE(run("top_card_after_discard", R"({"discard":10})").agrees(0.5));
    EXPECT_TRUE(run("faces_distinct", R"({"throws":2})").agrees(5.0 / 6));
    EXPECT_TRUE(run("dice_duel", R"({})").agrees(15.0 / 36));
}

TEST(MonteCarlo, ExpectationsMatchClosedForms) {
    EXPECT_TRUE(run("walk_cycle", R"({"n":6,"start":0,"target":0})").agrees(6.0));
    EXPECT_TRUE(run("walk_cycle", R"({"n":6,"start":3,"target":0})").agrees(9.0));
    EXPECT_TRUE(run("pattern_wait", R"({"pattern":"HH"})").agrees(6.0));
    EXPECT_TRUE(run("pattern_wait", R"({"pattern":"HT"})").agrees(4.0));
    EXPECT_TRUE(run("coupon", R"({"n":6})").agrees(14.7));
    EXPECT_TRUE(run("die_wait", R"({})").agrees(6.0));
}

TEST(MonteCarlo, ClassicProbabilities) {
    EXPECT_TRUE(run("gambler_ruin", R"({"start":1,"target":4})").agrees(0.25));
    EXPECT_TRUE(run("stick_triangle", R"({})").agrees(0.25));
    EXPECT_TRUE(run("birthday", R"({"people":23})").agrees(0.5072972343));
    EXPECT_TRUE(run("derangement", R"({"n":8})").agrees(14833.0 / 40320));
    EXPECT_TRUE(run("pigeonhole", R"({"coins":61,"boxes":15,"threshold":4})", 20'000).agrees(1.0));
    EXPECT_TRUE(run("markov_state", R"({"matrix":[[0.5,0.5],[0.25,0.75]],"state":0,"steps":60})").agrees(1.0 / 3));
    EXPECT_TRUE(run("urn_count", R"({"counts":[26,26],"draws":2,"color":0,"k":2,"cmp":"eq"})").agrees(25.0 / 102));
}

TEST(MonteCarlo, DetectsAWrongAnswer) {
    EXPECT_FALSE(run("dice_event", R"({"sums":[7]})").agrees(5.0 / 36));
}

TEST(MonteCarlo, IsDeterministicPerSeedAndThreadCount) {
    const auto s = oa::make_sampler("dice_event", Json::parse(R"({"sums":[7]})"));
    EXPECT_DOUBLE_EQ(oa::run_parallel(s, 100'000, 7, 4).mean, oa::run_parallel(s, 100'000, 7, 4).mean);
    EXPECT_THROW(static_cast<void>(oa::make_sampler("nope", Json())), std::invalid_argument);
}
