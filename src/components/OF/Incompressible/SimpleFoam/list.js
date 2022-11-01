// Copyright (c) 2022 Carlos Peña-Monferrer. All rights reserved.
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

const posts = [
 {
  title: "pitzDaily",
  link: "/OF/incompressible/simpleFoam/pitzDaily",
  key: "1",
  ready: true,
  surrogate: true,
  new: false,
  image: "/images/OF/incompressible/simpleFoam/pitzDaily/pitzDaily",
  description: `Turbulent free shear layer forming a rearward-facing step.
                \nData:
                  - P = 101325 Pa
                  - T = [-100, 1000] °C
                  - U_{inlet} = [1,20] m/s
                  - Turb. model = kEpsilon
                  - I_{inlet} = 5%
                \nDocs:
                  - https://ntrs.nasa.gov/citations/19810023603
               `
 },

 {
  title: "bump2D",
  link: "/OF/incompressible/simpleFoam/bump2D",
  key: "3",
  ready: true,
  surrogate: true,
  new: false,
  image: "/images/OF/incompressible/simpleFoam/bump2D/bump2D",
  description: `Turbulent air flow in a channel with a bump (wall curvature).
                \nData:
                  - P = 101325 Pa
                  - T = [-100, 1000] °C
                  - U_{inlet} = [5,100] m/s
                  - Turb. model = kOmegaSST
                  - k = 1.08e-03 m2/s2
                  - omega = 5220.8 s-1
                \nDocs:
                  - https://turbmodels.larc.nasa.gov/bump.html
               `
 },

 {
  title: "windAroundBuildings",
  link: "/OF/incompressible/simpleFoam/windAroundBuildings",
  key: "8",
  ready: true,
  surrogate: true,
  new: true,
  image: "/images/OF/incompressible/simpleFoam/windAroundBuildings/windAroundBuildings",
  description: `Wind around buildings..
                \nData:
                  - P = 101325 Pa
                  - v = 1.5e-05 m2/s
                  - U_{inlet} = 10 m/s
                  - Uα_{inlet} = [-40,40] °
                  - Turb. model = kEpsilon
                  - I_{inlet} = 10%
               `
 },

 {
  title: "airFoil2D",
  link: "/OF/incompressible/simpleFoam/airFoil2D",
  key: "2",
  ready: false,
  surrogate: false,
  new: false,
  image: "/images/OF/incompressible/simpleFoam/airFoil2D/airFoil2D",
  description: "Tutorial for a . \n\nData:\n  -P = 101325 Pa \n -T = [-100, 1000] °C \n -U_{inlet} = [1,100] m/s \n -Turb. model = SpalartAllmaras"
 },

 {
  title: "mixerVessel2D",
  link: "/OF/incompressible/simpleFoam/mixerVessel2D",
  key: "5",
  ready: true,
  surrogate: false,
  image: "/images/OF/incompressible/simpleFoam/mixerVessel2D/mixerVessel2D",
  description: `2D mixer vessel.
                \nVisualization of data from an OpenFOAM simulation.
                \nModel with ROM is pending for a multiple reference frame (MRF). See GitHub issue: https://github.com/simzero-oss/cfd-xyz/issues/1.
               `
 },

 {
  title: "motorBike",
  link: "/OF/incompressible/simpleFoam/motorBike",
  key: "6",
  ready: true,
  surrogate: false,
  new: false,
  image: "/images/OF/incompressible/simpleFoam/motorBike/motorBike",
  description: `Flow around a motorbike.
                \nVisualization of data from an OpenFOAM simulation.
                \nModel with ROM will be soon available.
               `
 },

 {
  title: "turbineSiting",
  link: "/OF/incompressible/simpleFoam/turbineSiting",
  key: "7",
  ready: true,
  surrogate: false,
  new: false,
  image: "/images/OF/incompressible/simpleFoam/turbineSiting/turbineSiting",
  description: `Flow around a turbine siting.
                \nVisualization of data from an OpenFOAM simulation.
                \nModel with ROM will be soon available.
               `
 }

]

export default posts;
