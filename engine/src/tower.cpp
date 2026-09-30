#include "oa/tower.hpp"

#include <algorithm>
#include <deque>
#include <stdexcept>
#include <unordered_map>

namespace oa {

namespace {

std::string key(const Towers& t) {
    std::string k;
    for (const auto& s : t) { k += s; k += '|'; }
    return k;
}

std::vector<Towers> neighbours(const Towers& t, const std::vector<int>& caps) {
    std::vector<Towers> out;
    for (std::size_t i = 0; i < t.size(); ++i) {
        if (t[i].empty()) continue;
        for (std::size_t j = 0; j < t.size(); ++j) {
            if (i == j || static_cast<int>(t[j].size()) >= caps[j]) continue;
            Towers n = t;
            n[j].push_back(n[i].back());
            n[i].pop_back();
            out.push_back(std::move(n));
        }
    }
    return out;
}

void check(const Towers& t, const std::vector<int>& caps) {
    if (t.size() != caps.size()) throw std::invalid_argument("towers and caps differ in size");
    for (std::size_t i = 0; i < t.size(); ++i)
        if (static_cast<int>(t[i].size()) > caps[i]) throw std::invalid_argument("tower over its cap");
}

}  // namespace

std::vector<Towers> tower_path(const Towers& start, const Towers& target, const std::vector<int>& caps) {
    check(start, caps); check(target, caps);
    std::unordered_map<std::string, std::string> parent;
    std::unordered_map<std::string, Towers> state;
    std::deque<Towers> q{start};
    parent[key(start)] = "";
    state[key(start)] = start;
    const std::string goal = key(target);
    while (!q.empty()) {
        Towers cur = q.front(); q.pop_front();
        const std::string ck = key(cur);
        if (ck == goal) {
            std::vector<Towers> path;
            for (std::string k = ck; !k.empty(); k = parent[k]) path.push_back(state[k]);
            std::reverse(path.begin(), path.end());
            return path;
        }
        for (auto& n : neighbours(cur, caps)) {
            const std::string nk = key(n);
            if (parent.count(nk)) continue;
            parent[nk] = ck;
            state[nk] = n;
            q.push_back(std::move(n));
        }
    }
    return {};
}

int tower_distance(const Towers& start, const Towers& target, const std::vector<int>& caps) {
    const auto p = tower_path(start, target, caps);
    return p.empty() ? -1 : static_cast<int>(p.size()) - 1;
}

std::vector<TowerLevel> tower_levels(const Towers& target, const std::vector<int>& caps, int depth, int count, std::uint64_t seed) {
    check(target, caps);
    // Reverse BFS from the target (moves are reversible), collecting states at exactly `depth`.
    std::unordered_map<std::string, int> dist{{key(target), 0}};
    std::vector<Towers> frontier{target}, at_depth;
    for (int d = 0; d < depth && !frontier.empty(); ++d) {
        std::vector<Towers> next;
        for (const auto& t : frontier)
            for (auto& n : neighbours(t, caps)) {
                if (dist.emplace(key(n), d + 1).second) next.push_back(std::move(n));
            }
        frontier = std::move(next);
    }
    at_depth = std::move(frontier);
    Rng r(seed);
    for (std::size_t i = at_depth.size(); i > 1; --i) std::swap(at_depth[i - 1], at_depth[r.below(i)]);
    std::vector<TowerLevel> out;
    for (const auto& s : at_depth) {
        if (static_cast<int>(out.size()) >= count) break;
        out.push_back({s, target, depth});
    }
    return out;
}

}  // namespace oa
