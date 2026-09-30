cmake_minimum_required(VERSION 3.20)
project(oa_engine LANGUAGES CXX)

# Conda ships an old GoogleTest; use the system one so headers and libraries match.
list(APPEND CMAKE_IGNORE_PREFIX_PATH /opt/miniconda3)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Release)
endif()

option(OA_SANITIZE "Build with AddressSanitizer and UndefinedBehaviorSanitizer" OFF)

add_library(oa_warnings INTERFACE)
target_compile_options(oa_warnings INTERFACE -Wall -Wextra -Wpedantic -Wshadow -Wconversion -Wno-sign-conversion)
if(OA_SANITIZE)
  target_compile_options(oa_warnings INTERFACE -fsanitize=address,undefined -fno-omit-frame-pointer)
  target_link_options(oa_warnings INTERFACE -fsanitize=address,undefined)
endif()

find_package(Threads REQUIRED)

add_library(oa_core STATIC
  src/json.cpp src/montecarlo.cpp src/orderbook.cpp src/numberbox.cpp
  src/tower.cpp src/figure.cpp src/balloon.cpp src/sequence.cpp src/commands.cpp)
target_include_directories(oa_core PUBLIC include)
target_link_libraries(oa_core PUBLIC oa_warnings Threads::Threads)

add_executable(oa-engine src/main.cpp)
target_link_libraries(oa-engine PRIVATE oa_core)

add_executable(oa-bench bench/bench.cpp)
target_link_libraries(oa-bench PRIVATE oa_core)

enable_testing()
find_package(GTest CONFIG REQUIRED)
add_executable(oa-tests
  tests/test_json.cpp tests/test_rational.cpp tests/test_montecarlo.cpp tests/test_orderbook.cpp
  tests/test_numberbox.cpp tests/test_tower.cpp tests/test_figure.cpp tests/test_balloon.cpp
  tests/test_sequence.cpp tests/test_commands.cpp)
target_link_libraries(oa-tests PRIVATE oa_core GTest::gtest_main)
include(GoogleTest)
gtest_discover_tests(oa-tests)
