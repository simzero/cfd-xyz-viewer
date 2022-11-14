# Copyright (c) 2022 Carlos Peña-Monferrer. All rights reserved.
# This work is licensed under the terms of the MIT license.
# For a copy, see <https://opensource.org/licenses/MIT>.

SHELL := /bin/bash

cfd-xyz-version := v1.1.0
surrogates-version := v1.1.0
cfd-xyz-image := ghcr.io/simzero-oss/cfd-xyz:$(cfd-xyz-version)
cfd-xyz := docker run --publish 5000:3000 --user node -it --entrypoint "" -w /work -v ${PWD}:/work $(cfd-xyz-image)
surrogates-data := surrogates_$(surrogates-version)
simulations-data := simulations_${surrogates-version}
surrogates-url := https://github.com/simzero-oss/cfd-xyz-data/raw/main/$(surrogates-data).zip
simulations-url := https://github.com/simzero-oss/cfd-xyz-data/raw/main/$(simulations-data).zip

all: install data build start
all-docker: install-docker data-docker build-docker start-docker

install:
	npm install
build:
	npm run build
start:
	npm start
data:
	curl -L $(surrogates-url) -o surrogates.zip
	curl -L $(simulations-url) -o simulations.zip
	unzip surrogates.zip -d public/
	unzip simulations.zip -d public/

install-docker:
	$(cfd-xyz) npm install
build-docker:
	$(cfd-xyz) npm run build
start-docker:
	echo "Serving on http://localhost:5000"
	$(cfd-xyz) npm start
data-docker:
	$(cfd-xyz) curl -LJ0 $(surrogates-url) -o surrogates.zip
	$(cfd-xyz) curl -LJ0 $(simulations-url) -o simulations.zip
	unzip surrogates.zip -d public/
	unzip simulations.zip -d public/
