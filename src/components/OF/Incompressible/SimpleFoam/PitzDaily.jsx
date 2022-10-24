// Copyright (c) 2022 Carlos Peña-Monferrer. All rights reserved.
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>. 

import { useEffect } from 'react';
import ROMView  from './../../ROMView';

const surrogatesPath = '/surrogates';

// - Define case custom data
const threeDimensions = false;
const stabilization = "PPE";
const initialZoomPortrait = 0.55;
const initialZoomLandscape = 1.3;
const offsetY = 0.0;
const dynamicTemperature = true;
const initialTemperature = 20;
const minTemperature = -100;
const maxTemperature = 1000;
const stepTemperature = 50.0;
const dynamicVelocity = true;
const initialVelocity = 1.0;
const minVelocity = 1.0;
const maxVelocity = 20.0;
const stepVelocity = 1.0;
const dynamicAngle = false;
const initialAngle = 0.0;
const viewerLink = "/src/components/OF/Incompressible/SimpleFoam/PitzDaily.jsx";
const ROMLink = "examples/OpenFOAM/incompressible/simpleFoam/pitzDaily";
//

function PitzDaily() {
  const casePath = window.location.pathname
  const caseName = casePath.split("/").pop();
  const path = surrogatesPath + casePath

  useEffect(() => {
    document.title = casePath;
  }, []);

  return (
    <div style={{ paddingBottom: 80}}>
      <ROMView
        threeDimensions={threeDimensions}
        caseName={caseName}
        path={path}
        ROMLink={ROMLink}
        viewerLink={viewerLink}
        stabilization={stabilization}
        initialZoomPortrait={initialZoomPortrait}
        initialZoomLandscape={initialZoomLandscape}
        offsetY={offsetY}
        dynamicTemperature={dynamicTemperature}
        initialTemperature={initialTemperature}
        minTemperature={minTemperature}
        maxTemperature={maxTemperature}
        stepTemperature={stepTemperature}
        dynamicVelocity={dynamicVelocity}
        initialVelocity={initialVelocity}
        minVelocity={minVelocity}
        maxVelocity={maxVelocity}
        stepVelocity={stepVelocity}
        dynamicAngle={dynamicAngle}
        initialAngle={initialAngle}
      />
    </div>
  );
}

export default PitzDaily;
