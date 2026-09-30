#include "oa/commands.hpp"

#include <functional>
#include <map>
#include <stdexcept>

#include "oa/balloon.hpp"
#include "oa/figure.hpp"
#include "oa/montecarlo.hpp"
#include "oa/numberbox.hpp"
#include "oa/orderbook.hpp"
#include "oa/sequence.hpp"
#include "oa/tower.hpp"

namespace oa {

namespace {

Json ok(Json::Object o) { o.emplace("ok", true); return Json(std::move(o)); }
Json strings(const std::vector<std::string>& v) { Json::Array a; for (const auto& s : v) a.emplace_back(s); return Json(std::move(a)); }
std::vector<int> ints(const Json& a) { std::vector<int> out; for (const auto& x : a.arr()) out.push_back(static_cast<int>(x.integer())); return out; }
Towers towers(const Json& a) { Towers t; for (const auto& x : a.arr()) t.push_back(x.str()); return t; }
Json towers_json(const Towers& t) { Json::Array a; for (const auto& s : t) a.emplace_back(s); return Json(std::move(a)); }

Board board_from(const Json& j) {
    Board b;
    for (const auto& p : j.at("products").arr()) b.products.push_back(p.str());
    for (const auto& i : j.at("instruments").arr()) b.instruments.push_back({i.at("id").str(), ints(i.at("legs")), i.at("bid").num(), i.at("ask").num()});
    return b;
}

const std::map<std::string, std::function<Json(const Json&)>>& handlers() {
    static const std::map<std::string, std::function<Json(const Json&)>> H = {
        {"models", [](const Json&) { return ok({{"models", strings(model_names())}}); }},
        {"mc", [](const Json& r) {
            const auto res = run_parallel(make_sampler(r.at("model").str(), r.has("params") ? r.at("params") : Json(Json::Object{})),
                                          static_cast<std::uint64_t>(r.int_or("samples", 1'000'000)), static_cast<std::uint64_t>(r.int_or("seed", 1)),
                                          static_cast<unsigned>(r.int_or("threads", 0)));
            Json::Object o{{"mean", Json(res.mean)}, {"stdError", Json(res.std_error)}, {"samples", Json(static_cast<double>(res.samples))}};
            if (r.has("expected")) o.emplace("agrees", Json(res.agrees(r.at("expected").num(), r.num_or("sigmas", 4.0))));
            return ok(std::move(o));
        }},
        {"orderbook", [](const Json& r) {
            const Board b = board_from(r.at("board"));
            const bool indec = r.has("indecomposable") && r.at("indecomposable").boolean();
            const auto s = solve_orderbook(b, static_cast<int>(r.int_or("maxUnits", 6)), indec);
            Json::Array trades;
            for (const auto& t : s.trades) trades.emplace_back(Json::Object{{"id", Json(t.id)}, {"side", Json(t.buy ? "buy" : "sell")}, {"units", Json(t.units)}});
            return ok({{"found", Json(s.found)}, {"profit", Json(s.profit)}, {"units", Json(s.units)}, {"nodes", Json(static_cast<double>(s.nodes))}, {"trades", Json(std::move(trades))}});
        }},
        {"numberbox", [](const Json& r) {
            const auto t = r.at("target");
            const Rational target = t.is_number() ? rational_from_double(t.num()) : Rational(t.at("n").integer(), t.at("d").integer());
            const auto s = solve_numberbox(ints(r.at("numbers")), target);
            return ok({{"solvable", Json(s.solvable)}, {"derivations", Json(static_cast<double>(s.derivations))}, {"expression", Json(s.expression)}});
        }},
        {"numberbox_eval", [](const Json& r) {
            const Rational v = eval_expression(r.at("expression").str());
            return ok({{"value", Json(v.str())}, {"numeric", Json(v.to_double())}});
        }},
        {"numberbox_table", [](const Json& r) {
            Json::Object targets;
            for (const auto& [k, n] : reachable_integers(ints(r.at("numbers")))) targets.emplace(std::to_string(k), Json(static_cast<double>(n)));
            return ok({{"targets", Json(std::move(targets))}});
        }},
        {"tower_solve", [](const Json& r) {
            const auto caps = ints(r.at("caps"));
            const auto path = tower_path(towers(r.at("start")), towers(r.at("target")), caps);
            Json::Array p;
            for (const auto& s : path) p.push_back(towers_json(s));
            return ok({{"optimal", Json(static_cast<int>(path.size()) - 1)}, {"path", Json(std::move(p))}});
        }},
        {"tower_levels", [](const Json& r) {
            const auto lv = tower_levels(towers(r.at("target")), ints(r.at("caps")), static_cast<int>(r.at("depth").integer()),
                                         static_cast<int>(r.int_or("count", 10)), static_cast<std::uint64_t>(r.int_or("seed", 1)));
            Json::Array a;
            for (const auto& l : lv) a.emplace_back(Json::Object{{"start", towers_json(l.start)}, {"target", towers_json(l.target)}, {"optimal", Json(l.optimal)}});
            return ok({{"levels", Json(std::move(a))}});
        }},
        {"figure", [](const Json& r) {
            const auto v = ints(r.at("values"));
            return ok({{"expected", Json(figure_expected_formula(v))}, {"expectedDp", Json(figure_expected_dp(v))},
                       {"worstCase", Json(figure_worst_case(v))}, {"oneAtATime", Json(figure_expected_one_at_a_time(v))}});
        }},
        {"balloon", [](const Json& r) {
            const auto p = balloon_optimal(static_cast<int>(r.at("balloons").integer()), static_cast<int>(r.at("cents").integer()),
                                           static_cast<int>(r.at("popMax").integer()), r.num_or("penalty", 0.0));
            Json::Array acts;
            for (const int a : p.first_actions) acts.emplace_back(a);
            return ok({{"expectedCents", Json(p.expected_cents)}, {"optimalAtStart", Json(p.optimal_at_start)}, {"firstActions", Json(std::move(acts))}});
        }},
        {"sequence", [](const Json& r) {
            std::vector<Rational> terms;
            for (const auto& t : r.at("terms").arr()) terms.push_back(rational_from_double(t.num()));
            Json::Array preds;
            for (const auto& p : predict_next(terms))
                preds.emplace_back(Json::Object{{"rule", Json(p.rule)}, {"next", Json(p.next.str())}, {"nextValue", Json(p.next.to_double())}, {"complexity", Json(p.complexity)}});
            return ok({{"predictions", Json(std::move(preds))}});
        }},
    };
    return H;
}

}  // namespace

Json dispatch(const Json& request) {
    try {
        const std::string cmd = request.at("cmd").str();
        const auto& H = handlers();
        const auto it = H.find(cmd);
        if (it == H.end()) throw std::invalid_argument("unknown command: " + cmd);
        Json out = it->second(request);
        return out;
    } catch (const std::exception& e) {
        return Json(Json::Object{{"ok", Json(false)}, {"error", Json(std::string(e.what()))}});
    }
}

}  // namespace oa
