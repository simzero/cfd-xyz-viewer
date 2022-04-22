# Copyright (c) 2022 Carlos Peña-Monferrer. All rights reserved.
# This work is licensed under the terms of the MIT license.
# For a copy, see <https://opensource.org/licenses/MIT>.

SHELL := /bin/bash

cfd-xyz-image := ghcr.io/simzero-oss/cfd-xyz:${VERSION}
cfd-xyz := docker run --user node -it --entrypoint "" -w /work -v ${PWD}:/work $(cfd-xyz-image)
surrogates-data := surrogates_${VERSION}
simulations-data := simulations_${VERSION}
surrogates-url := https://github.com/simzero-oss/cfd-xyz-data/raw/main/$(surrogates-data).tar.gz
simulations-url := https://github.com/simzero-oss/cfd-xyz-data/raw/main/$(simulations-data).tar.gz

all: install run-build data start
all-docker: install-docker run-build-docker data-docker start-docker

install:
	npm install
run-build:
	npm run build
start:
	npm start
data:
	curl -L $(surrogates-url) -o surrogates.tar.gz
	curl -L $(simulations-url) -o simulations.tar.gz
	tar -zxvf surrogates.tar.gz -C public/
	tar -zxvf simulations.tar.gz -C public/

install-docker:
	$(cfd-xyz) npm install
run-build-docker:
	$(cfd-xyz) npm run build
start-docker:
	$(cfd-xyz) npm start
data-docker:
	$(cfd-xyz) curl -LJ0 $(surrogates-url) -o surrogates.tar.gz
	$(cfd-xyz) curl -LJ0 $(simulations-url) -o simulations.tar.gz
	tar -zxvf surrogates.tar.gz -C public/surrogates
	tar -zxvf simulations.tar.gz -C public/simulations
