.PHONEY: build, run

build: image

run: image
	./image $(file)

program: main.cpp uselibpng.c
	clang++ -O3 -I. main.cpp uselibpng.c -lpng -o program