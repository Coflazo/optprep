#include "oa/numberbox.hpp"

#include <functional>
#include <stdexcept>
#include <utility>

namespace oa {

namespace {

struct Term { Rational v; std::string e; };

// Visit every value obtainable from the multiset (pairwise reduction). The callback
// sees each final value once per derivation. Commutative ops are tried once per pair.
void reduce(std::vector<Term>& ts, const std::function<void(const Term&)>& on_final) {
    if (ts.size() == 1) { on_final(ts[0]); return; }
    for (std::size_t i = 0; i < ts.size(); ++i)
        for (std::size_t j = i + 1; j < ts.size(); ++j) {
            const Term a = ts[i], b = ts[j];
            std::vector<Term> rest;
            for (std::size_t k = 0; k < ts.size(); ++k) if (k != i && k != j) rest.push_back(ts[k]);
            std::vector<Term> cand = {
                {a.v + b.v, "(" + a.e + " + " + b.e + ")"},
                {a.v * b.v, "(" + a.e + " × " + b.e + ")"},
                {a.v - b.v, "(" + a.e + " − " + b.e + ")"},
                {b.v - a.v, "(" + b.e + " − " + a.e + ")"},
            };
            if (!b.v.is_zero()) cand.push_back({a.v / b.v, "(" + a.e + " ÷ " + b.e + ")"});
            if (!a.v.is_zero()) cand.push_back({b.v / a.v, "(" + b.e + " ÷ " + a.e + ")"});
            for (auto& c : cand) {
                rest.push_back(c);
                reduce(rest, on_final);
                rest.pop_back();
            }
        }
}

std::string strip_outer(std::string e) {
    if (e.size() > 2 && e.front() == '(' && e.back() == ')') {
        int depth = 0;
        for (std::size_t i = 0; i < e.size(); ++i) {
            depth += e[i] == '(' ? 1 : e[i] == ')' ? -1 : 0;
            if (depth == 0 && i + 1 < e.size()) return e;
        }
        return e.substr(1, e.size() - 2);
    }
    return e;
}

}  // namespace

NumberBoxResult solve_numberbox(const std::vector<int>& numbers, const Rational& target) {
    std::vector<Term> ts;
    for (const int n : numbers) ts.push_back({Rational(n), std::to_string(n)});
    NumberBoxResult r;
    reduce(ts, [&](const Term& t) {
        if (t.v == target) { ++r.derivations; if (!r.solvable) { r.solvable = true; r.expression = strip_outer(t.e); } }
    });
    return r;
}

std::map<long long, long long> reachable_integers(const std::vector<int>& numbers) {
    std::vector<Term> ts;
    for (const int n : numbers) ts.push_back({Rational(n), ""});
    std::map<long long, long long> out;
    reduce(ts, [&](const Term& t) { if (t.v.is_integer()) ++out[t.v.num()]; });
    return out;
}

// Recursive-descent evaluator for "1 + (2 × 3) ÷ 4" with + - * / × ÷ − (independent check of shown solutions).
Rational eval_expression(const std::string& s) {
    std::size_t i = 0;
    auto skip = [&] { while (i < s.size() && s[i] == ' ') ++i; };
    auto match = [&](std::string_view tok) { skip(); if (s.compare(i, tok.size(), tok) == 0) { i += tok.size(); return true; } return false; };
    std::function<Rational()> expr, term, factor;
    factor = [&]() -> Rational {
        skip();
        if (match("(")) { Rational v = expr(); if (!match(")")) throw std::invalid_argument("missing )"); return v; }
        const std::size_t st = i;
        while (i < s.size() && std::isdigit(static_cast<unsigned char>(s[i]))) ++i;
        if (st == i) throw std::invalid_argument("expected number");
        return Rational(std::stoll(s.substr(st, i - st)));
    };
    term = [&]() -> Rational {
        Rational v = factor();
        while (true) {
            if (match("×") || match("*")) v = v * factor();
            else if (match("÷") || match("/")) v = v / factor();
            else return v;
        }
    };
    expr = [&]() -> Rational {
        Rational v = term();
        while (true) {
            if (match("+")) v = v + term();
            else if (match("−") || match("-")) v = v - term();
            else return v;
        }
    };
    Rational v = expr();
    skip();
    if (i != s.size()) throw std::invalid_argument("trailing input in expression");
    return v;
}

}  // namespace oa
