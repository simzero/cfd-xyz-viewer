# Copyright (c) 2022 Carlos Peña-Monferrer. All rights reserved.
# This work is licensed under the terms of the MIT license.
# For a copy, see <https://opensource.org/licenses/MIT>.

SHELL := /bin/bash

version := v1.0.0-rc.1
cfd-xyz-image := cfd-xyz:$(version)
cfd-xyz := docker run --user node -it --entrypoint "" -w /work -v ${PWD}:/work $(cfd-xyz-image)
data-version := surrogates_$(version)
data-url := https://github.com/carpemonf/rom-js-data/raw/main/$(data-version).tar.gz

all: install run-build data start
all-docker: install-docker run-build-docker data-docker start-docker

install:
	npm install
run-build:
	npm run build
start:
	npm start
data:
	curl -L $(data-url) -o surrogates.tar.gz
	tar -zxvf surrogates.tar.gz -C public/

install-docker:
	$(cfd-xyz) npm install
run-build-docker:
	$(cfd-xyz) npm run build
start-docker:
	$(cfd-xyz) npm start
data-docker:
	$(cfd-xyz) curl -LJ0 $(data-url) -o surrogates.tar.gz
	tar -zxvf surrogates.tar.gz -C public/
