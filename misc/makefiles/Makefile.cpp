EXECBIN  = execname

SOURCES  = $(wildcard *.cpp)
OBJECTS  = $(SOURCES:%.cpp=%.o)

CXX       = g++ -std=c++17
CXXFLAGS   = -Wall -Wpedantic -Werror -Wextra

.PHONY: all clean

all: $(EXECBIN)

$(EXECBIN): $(OBJECTS)
	$(CXX) $^ -o $@

%.o : %.cpp
	$(CXX) $(CXXFLAGS) -c $<

clean:
	rm -f $(EXECBIN) $(OBJECTS)

