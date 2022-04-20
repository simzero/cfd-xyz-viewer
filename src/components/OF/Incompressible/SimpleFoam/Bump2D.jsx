// Copyright (c) 2022 Carlos Peña-Monferrer. All rights reserved.
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>. 

import { useEffect } from 'react';
import ROMView  from './../../ROMView';

const surrogatesPath = '/surrogates';

// - Define case custom data
const initialZoomPortrait = 20.0;
const initialZoomLandscape = 145.0;
const offsetY = -2.4;
const initialTemperature = 0; // 1e-05
const minTemperature = -50;
const maxTemperature = 50;
const stepTemperature = 1.0;
const initialVelocity = 40.0;
const minVelocity = 5.0;
const maxVelocity = 90.0;
const stepVelocity = 1.0;
const MB=19.6;
const codeLink = "/src/components/OF/Incompressible/SimpleFoam/Bump2D.jsx";
//

function Bump2D() {
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

export default Bump2D;
