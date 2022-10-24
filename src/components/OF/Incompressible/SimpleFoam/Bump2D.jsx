// Copyright (c) 2022 Carlos Peña-Monferrer. All rights reserved.
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>. 

import { useEffect } from 'react';
import ROMView  from './../../ROMView';

const surrogatesPath = '/surrogates';

// - Define case custom data
const threeDimensions = false;
const stabilization = "PPE";
const initialZoomPortrait = 20.0;
const initialZoomLandscape = 145.0;
const offsetY = -2.4;
const dynamicTemperature = true;
const initialTemperature = 20;
const minTemperature = -50;
const maxTemperature = 50;
const stepTemperature = 5.0;
const dynamicVelocity = true;
const initialVelocity = 5.0;
const minVelocity = 5.0;
const maxVelocity = 70.0;
const stepVelocity = 2.0;
const dynamicAngle = false;
const initialAngle = 0.0;
const viewerLink = "/src/components/OF/Incompressible/SimpleFoam/Bump2D.jsx";
const ROMLink = "examples/OpenFOAM/incompressible/simpleFoam/bump2D";
//

function Bump2D() {
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

export default Bump2D;
