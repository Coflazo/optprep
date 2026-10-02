# oa-engine

C++20 engine behind the trainer's verification and puzzle banks. No dependencies beyond the standard library. Tests use GoogleTest: an installed copy if CMake finds one, otherwise CMake downloads it (`-DOA_BUILD_TESTS=OFF` skips tests). Needs GCC or Clang (`__int128`); on Windows use MinGW-w64, not MSVC.

| Command | What it does |
|---|---|
| `mc` | Parallel Monte Carlo (xoshiro256**, one jumped stream per thread) over 22 probability models; returns mean, standard error and whether an expected answer agrees within 4σ |
| `orderbook` | Exact max-profit flat position by branch and bound (L1 flatness bound + per-unit cash bound) |
| `numberbox`, `numberbox_eval`, `numberbox_table` | Exhaustive exact-rational search for make-the-target puzzles; independent expression evaluator |
| `tower_solve`, `tower_levels` | Skyscraper BFS optimum and reverse-BFS level generation at an exact depth |
| `figure` | Figure It Out optimal expected guesses (closed form and dynamic programme) |
| `balloon` | Balloon optimal stopping by dynamic programming over (balloons left, bank) |
| `sequence` | NumberLogic rule search: every continuation explained by a rule template, ranked by simplicity |

```bash
cmake -S . -B build -G Ninja -DCMAKE_PREFIX_PATH=/usr/local && cmake --build build
ctest --test-dir build                     # 34 tests
./build/oa-bench                           # throughput
echo '{"cmd":"numberbox","numbers":[3,3,8,8],"target":24}' | ./build/oa-engine
# sanitizers
cmake -S . -B build-san -G Ninja -DCMAKE_BUILD_TYPE=Debug -DOA_SANITIZE=ON -DCMAKE_PREFIX_PATH=/usr/local
cmake --build build-san && ./build-san/oa-tests
```

Measured on a 2017 dual-core i5 (4 threads): Monte Carlo 238M samples/s; all 495 NumberBox sets for 24 in 0.8 s (404 solvable, the known count); 4,300 orderbook boards/s.
