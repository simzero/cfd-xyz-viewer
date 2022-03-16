# cfd.xyz

[![Website shields.io](https://img.shields.io/website-up-down-green-red/http/shields.io.svg)](http://cfd.xyz)
[![Docker](https://badgen.net/badge/icon/docker?icon=docker&label)](https://github.com/orgs/simzero-oss/packages/container/package/cfd-xyz)
[![stability-beta](https://img.shields.io/badge/stability-beta-33bbff.svg)]()
[![Join Slack](https://img.shields.io/badge/Join%20us%20on-Slack-e01563.svg)](https://join.slack.com/t/cfd-xyz/shared_invite/zt-12uquswo6-FFVy95vRjfMF~~t8j~UBHA)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/carpemonf/cfd-xyz/blob/main/LICENSE)
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

[cfd.xyz](http://cfd.xyz) is an open-source web app to efficiently and easily explore fluid dynamics problems for a wide range of parameters. The framework provides a proof of technology for OpenFOAM tutorials, showing the whole process from the generation of the surrogate models to the web browser. It also includes a standalone web tool for visualizing users' models by directly dragging and dropping the output folder of the ROM offline stage. Beyond the current proof of technology, this enables a collaborative effort for the implementation of OpenFOAM-based surrogate models in applications demanding real-time solutions such as digital twins and other digital transformation technologies.

We aim with the developments presented in this work to create a common place where canonical and industrial CFD problems can be visualized and analyzed without carrying out a simulation, or as a preliminary step for optimizing parameters of new simulations. Having an open-source centralized service has several advantages from educational, optimization and reproducibility point of views. But also from a CO2 footprint perspective.

The web app relies on the [rom.js](https://github.com/carpemonf/rom-js) module, a JavaScript port of a set of open-source packages (Eigen, Splinter and VTK/C++, ITHACA-FV) to solve the online stage of reduced-order models (ROM) generated by the ITHACA-FV tool. It can also be executed outside a web browser within a backend JavaScript runtime environment, or in a given web solution.


This is a beta version, please handle it with care. Further features, optimizations and fixes are expected. We are also working on including machine learning data-driven methods. Contact us or join the [Slack channel](https://join.slack.com/t/cfd-xyz/shared_invite/zt-12uquswo6-FFVy95vRjfMF~~t8j~UBHA) if you want to collaborate.

### Requirements

* [Docker](https://www.docker.com/get-started) 20.10.12
* npm 6.14.11 (optional)

## Installation

You can install and serve `cfd-xyz` in your computer with `npm`:

```
make all
```

And start the web by entering `http://localhost:3000` in your browser.

Alternatively, you can use the [Docker image](https://github.com/orgs/simzero-oss/packages/container/package/cfd-xyz) for building and serving the web:

```
make all-docker
```

The web will be accessible at `http://localhost:3001`.

## License

Code on this repository is covered by the MIT license. All the media/images in the `public` directory are CC BY 4.0 except the `public/constructionSolver.png` image that is covered by CC0. The cfd.xyz logo, SIMZERO and OpenFOAM are trademarks. A full description of the licenses can be found below:

* Code: [MIT](https://github.com/carpemonf/cfd-xyz/blob/main/LICENSE)
* Media: [CC BY 4.0](https://github.com/carpemonf/cfd-xyz/blob/main/LICENSE-CC-BY)
* Media (`public/constructionSolver.png`): [CC0](https://github.com/carpemonf/cfd-xyz/blob/main/LICENSE-CC-0)

* Trademarks:
  - OPENFOAM® is a registered trade mark of OpenCFD Limited, producer and distributor of the OpenFOAM software via [www.openfoam.com](www.openfoam.com).
  - cfd.xyz logo and SIMZERO are exclusive trademarks. Their use is only allowed in the context of this web app and in compliance with trademark law. Adaptations or modifications of the cfd.xyz logo are not permitted.
