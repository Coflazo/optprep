#include "oa/json.hpp"

#include <cmath>
#include <cstdio>
#include <sstream>

namespace oa {

double Json::num() const {
    if (const auto* d = std::get_if<double>(&v_)) return *d;
    throw std::runtime_error("json: expected number");
}
long long Json::integer() const {
    const double d = num();
    if (std::floor(d) != d) throw std::runtime_error("json: expected integer");
    return static_cast<long long>(d);
}
bool Json::boolean() const {
    if (const auto* b = std::get_if<bool>(&v_)) return *b;
    throw std::runtime_error("json: expected boolean");
}
const std::string& Json::str() const {
    if (const auto* s = std::get_if<std::string>(&v_)) return *s;
    throw std::runtime_error("json: expected string");
}
const Json::Array& Json::arr() const {
    if (const auto* a = std::get_if<std::shared_ptr<Array>>(&v_)) return **a;
    throw std::runtime_error("json: expected array");
}
const Json::Object& Json::obj() const {
    if (const auto* o = std::get_if<std::shared_ptr<Object>>(&v_)) return **o;
    throw std::runtime_error("json: expected object");
}
const Json& Json::at(std::string_view key) const {
    const auto& o = obj();
    const auto it = o.find(key);
    if (it == o.end()) throw std::runtime_error("json: missing key " + std::string(key));
    return it->second;
}
bool Json::has(std::string_view key) const { return is_object() && obj().find(key) != obj().end(); }
double Json::num_or(std::string_view key, double fallback) const { return has(key) ? at(key).num() : fallback; }
long long Json::int_or(std::string_view key, long long fallback) const { return has(key) ? at(key).integer() : fallback; }

namespace {

void dump_string(std::ostringstream& os, const std::string& s) {
    os << '"';
    for (const unsigned char c : s) {
        switch (c) {
            case '"': os << "\\\""; break;
            case '\\': os << "\\\\"; break;
            case '\n': os << "\\n"; break;
            case '\r': os << "\\r"; break;
            case '\t': os << "\\t"; break;
            default:
                if (c < 0x20) { char buf[8]; std::snprintf(buf, sizeof buf, "\\u%04x", c); os << buf; }
                else os << static_cast<char>(c);
        }
    }
    os << '"';
}

void dump_value(std::ostringstream& os, const Json& j);

void dump_number(std::ostringstream& os, double d) {
    if (!std::isfinite(d)) { os << "null"; return; }
    if (std::floor(d) == d && std::fabs(d) < 9e15) { os << static_cast<long long>(d); return; }
    char buf[32];
    std::snprintf(buf, sizeof buf, "%.17g", d);
    os << buf;
}

void dump_value(std::ostringstream& os, const Json& j) {
    if (j.is_null()) os << "null";
    else if (j.is_number()) dump_number(os, j.num());
    else if (j.is_string()) dump_string(os, j.str());
    else if (j.is_array()) {
        os << '[';
        bool first = true;
        for (const auto& x : j.arr()) { if (!first) os << ','; first = false; dump_value(os, x); }
        os << ']';
    } else if (j.is_object()) {
        os << '{';
        bool first = true;
        for (const auto& [k, v] : j.obj()) { if (!first) os << ','; first = false; dump_string(os, k); os << ':'; dump_value(os, v); }
        os << '}';
    } else os << (j.boolean() ? "true" : "false");
}

class Parser {
public:
    explicit Parser(std::string_view t) : t_(t) {}
    Json run() {
        Json v = value();
        ws();
        if (i_ != t_.size()) fail("trailing characters");
        return v;
    }

private:
    [[noreturn]] void fail(const char* what) const { throw std::runtime_error(std::string("json parse error at ") + std::to_string(i_) + ": " + what); }
    void ws() { while (i_ < t_.size() && (t_[i_] == ' ' || t_[i_] == '\n' || t_[i_] == '\r' || t_[i_] == '\t')) ++i_; }
    char peek() { ws(); if (i_ >= t_.size()) fail("unexpected end"); return t_[i_]; }
    void expect(char c) { if (peek() != c) fail("unexpected character"); ++i_; }
    bool lit(std::string_view w) { if (t_.substr(i_, w.size()) == w) { i_ += w.size(); return true; } return false; }
    Json value() {
        const char c = peek();
        if (c == '{') return object();
        if (c == '[') return array();
        if (c == '"') return Json(string());
        if (lit("true")) return Json(true);
        if (lit("false")) return Json(false);
        if (lit("null")) return Json();
        return Json(number());
    }
    Json object() {
        expect('{');
        Json::Object o;
        if (peek() == '}') { ++i_; return Json(std::move(o)); }
        while (true) {
            if (peek() != '"') fail("expected key");
            std::string k = string();
            expect(':');
            o.emplace(std::move(k), value());
            if (peek() == ',') { ++i_; continue; }
            expect('}');
            return Json(std::move(o));
        }
    }
    Json array() {
        expect('[');
        Json::Array a;
        if (peek() == ']') { ++i_; return Json(std::move(a)); }
        while (true) {
            a.push_back(value());
            if (peek() == ',') { ++i_; continue; }
            expect(']');
            return Json(std::move(a));
        }
    }
    std::string string() {
        expect('"');
        std::string out;
        while (true) {
            if (i_ >= t_.size()) fail("unterminated string");
            const char c = t_[i_++];
            if (c == '"') return out;
            if (c != '\\') { out.push_back(c); continue; }
            if (i_ >= t_.size()) fail("bad escape");
            const char e = t_[i_++];
            switch (e) {
                case '"': out.push_back('"'); break;
                case '\\': out.push_back('\\'); break;
                case '/': out.push_back('/'); break;
                case 'b': out.push_back('\b'); break;
                case 'f': out.push_back('\f'); break;
                case 'n': out.push_back('\n'); break;
                case 'r': out.push_back('\r'); break;
                case 't': out.push_back('\t'); break;
                case 'u': {
                    if (i_ + 4 > t_.size()) fail("bad unicode escape");
                    const unsigned cp = static_cast<unsigned>(std::stoul(std::string(t_.substr(i_, 4)), nullptr, 16));
                    i_ += 4;
                    if (cp < 0x80) out.push_back(static_cast<char>(cp));
                    else if (cp < 0x800) { out.push_back(static_cast<char>(0xC0 | (cp >> 6))); out.push_back(static_cast<char>(0x80 | (cp & 0x3F))); }
                    else { out.push_back(static_cast<char>(0xE0 | (cp >> 12))); out.push_back(static_cast<char>(0x80 | ((cp >> 6) & 0x3F))); out.push_back(static_cast<char>(0x80 | (cp & 0x3F))); }
                    break;
                }
                default: fail("bad escape");
            }
        }
    }
    double number() {
        const std::size_t start = i_;
        if (i_ < t_.size() && (t_[i_] == '-' || t_[i_] == '+')) ++i_;
        while (i_ < t_.size() && (std::isdigit(static_cast<unsigned char>(t_[i_])) || t_[i_] == '.' || t_[i_] == 'e' || t_[i_] == 'E' || t_[i_] == '-' || t_[i_] == '+')) ++i_;
        if (start == i_) fail("expected value");
        try { return std::stod(std::string(t_.substr(start, i_ - start))); } catch (...) { fail("bad number"); }
    }
    std::string_view t_;
    std::size_t i_ = 0;
};

}  // namespace

std::string Json::dump() const { std::ostringstream os; dump_value(os, *this); return os.str(); }
Json Json::parse(std::string_view text) { return Parser(text).run(); }

}  // namespace oa
