SHELL := /bin/bash

cfd-xyz-image := cfd-xyz:v0.1
cfd-xyz := docker run --user node -it --entrypoint "" -w /work -v ${PWD}:/work $(cfd-xyz-image)
data-url := https://github.com/carpemonf/rom-js-data/raw/main/surrogates_v0.1.tar.gz

all: install run-build data start

install:
	$(cfd-xyz) npm install
run-build:
	$(cfd-xyz) npm run build
start:
	$(cfd-xyz) npm start
data:
	$(cfd-xyz) curl -LJ0 $(data-url) -o surrogates.tar.gz
	tar -zxvf surrogates.tar.gz -C public/
