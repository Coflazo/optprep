#pragma once
// Minimal JSON value, parser and writer for the engine's JSON-lines CLI.
// Covers the full grammar (objects, arrays, numbers, strings with escapes,
// true/false/null); no external dependency.
#include <map>
#include <memory>
#include <stdexcept>
#include <string>
#include <string_view>
#include <variant>
#include <vector>

namespace oa {

class Json {
public:
    using Array = std::vector<Json>;
    using Object = std::map<std::string, Json, std::less<>>;

    Json() = default;                                        // null
    Json(std::nullptr_t) {}                                  // NOLINT
    Json(bool b) : v_(b) {}                                  // NOLINT
    Json(double d) : v_(d) {}                               // NOLINT
    Json(int i) : v_(static_cast<double>(i)) {}              // NOLINT
    Json(long i) : v_(static_cast<double>(i)) {}             // NOLINT
    Json(long long i) : v_(static_cast<double>(i)) {}        // NOLINT
    Json(unsigned long i) : v_(static_cast<double>(i)) {}    // NOLINT
    Json(unsigned long long i) : v_(static_cast<double>(i)) {}  // NOLINT
    Json(const char* s) : v_(std::string(s)) {}              // NOLINT
    Json(std::string s) : v_(std::move(s)) {}                // NOLINT
    Json(Array a) : v_(std::make_shared<Array>(std::move(a))) {}    // NOLINT
    Json(Object o) : v_(std::make_shared<Object>(std::move(o))) {}  // NOLINT

    [[nodiscard]] bool is_null() const noexcept { return std::holds_alternative<std::monostate>(v_); }
    [[nodiscard]] bool is_number() const noexcept { return std::holds_alternative<double>(v_); }
    [[nodiscard]] bool is_string() const noexcept { return std::holds_alternative<std::string>(v_); }
    [[nodiscard]] bool is_array() const noexcept { return std::holds_alternative<std::shared_ptr<Array>>(v_); }
    [[nodiscard]] bool is_object() const noexcept { return std::holds_alternative<std::shared_ptr<Object>>(v_); }

    [[nodiscard]] double num() const;
    [[nodiscard]] long long integer() const;
    [[nodiscard]] bool boolean() const;
    [[nodiscard]] const std::string& str() const;
    [[nodiscard]] const Array& arr() const;
    [[nodiscard]] const Object& obj() const;
    [[nodiscard]] const Json& at(std::string_view key) const;
    [[nodiscard]] bool has(std::string_view key) const;
    [[nodiscard]] double num_or(std::string_view key, double fallback) const;
    [[nodiscard]] long long int_or(std::string_view key, long long fallback) const;

    [[nodiscard]] std::string dump() const;
    static Json parse(std::string_view text);

private:
    std::variant<std::monostate, bool, double, std::string, std::shared_ptr<Array>, std::shared_ptr<Object>> v_;
};

}  // namespace oa
