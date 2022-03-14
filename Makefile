SHELL := /bin/bash

cfd-xyz-image := cfd-xyz:v0.1
cfd-xyz := docker run --user node -it --entrypoint "" -w /work -v ${PWD}:/work $(cfd-xyz-image)

all: install run-build start

install:
	$(cfd-xyz) npm install
run-build:
	$(cfd-xyz) npm run build
start:
	$(cfd-xyz) npm start
