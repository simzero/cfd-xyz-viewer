# Copyright (c) 2022 Carlos Peña-Monferrer. All rights reserved.
# This work is licensed under the terms of the MIT license.
# For a copy, see <https://opensource.org/licenses/MIT>.

SHELL := /bin/bash

cfd-xyz-image := cfd-xyz:v1.0.0-rc.1
cfd-xyz := docker run --user node -it --entrypoint "" -w /work -v ${PWD}:/work $(cfd-xyz-image)
data-version := surrogates_v1.0.0-beta.0
data-url := https://github.com/carpemonf/rom-js-data/raw/main/$(data-version).tar.gz

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
