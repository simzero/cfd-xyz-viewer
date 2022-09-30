// Copyright (c) 2022 Carlos Peña-Monferrer. All rights reserved.
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>. 

import { useEffect } from 'react';
import ROMView  from './../../ROMView';

const surrogatesPath = '/surrogates';

// - Define case custom data
const stabilization = "supremizer";
const initialZoomPortrait = 0.55;
const initialZoomLandscape = 1.3;
const offsetY = 0.0;
const initialTemperature = 20;
const minTemperature = -100;
const maxTemperature = 1000;
const stepTemperature = 50.0;
const initialVelocity = 1.0;
const minVelocity = 1.0;
const maxVelocity = 20.0;
const stepVelocity = 1.0;
const MB=19.6;
const codeLink = "/src/components/OF/Incompressible/SimpleFoam/PitzDaily.jsx";
//

function PitzDaily() {
  const casePath = window.location.pathname
  const caseName = casePath.split("/").pop();
  const rootPath = surrogatesPath + casePath + "/"

  useEffect(() => {
    document.title = casePath;
  }, []);

  return (
    <div style={{ paddingBottom: 80}}>
      <ROMView
        caseName={caseName}
        rootPath={rootPath}
        MB={MB}
        codeLink={codeLink}
        stabilization={stabilization}
        initialZoomPortrait={initialZoomPortrait}
        initialZoomLandscape={initialZoomLandscape}
        offsetY={offsetY}
        initialTemperature={initialTemperature}
        minTemperature={minTemperature}
        maxTemperature={maxTemperature}
        stepTemperature={stepTemperature}
        initialVelocity={initialVelocity}
        minVelocity={minVelocity}
        maxVelocity={maxVelocity}
        stepVelocity={stepVelocity}
      />
    </div>
  );
}

export default PitzDaily;
