import { useEffect } from 'react';
import ROMView  from './../../ROMView';

const surrogatesPath = '/surrogates';

// - Define case custom data
const threeDimensions = true;
const initialPlanesCoords = [300.0, 150.0, 28.0];
const stepPlanes = 1.0;
const stabilization = "PPE";
const initialZoomPortrait = 0.55;
const initialZoomLandscape = 1.15;
const offsetY = 10.0;
const dynamicTemperature = false;
const initialTemperature = 66.029869;
const dynamicVelocity = false;
const initialVelocity = 10.0;
const dynamicAngle = true;
const initialAngle = 0.0;
const minAngle = -40.0;
const maxAngle = 40.0;
const stepAngle = 2.0;
const viewerLink = "/src/components/OF/Incompressible/SimpleFoam/WindAroundBuildings.jsx";
const ROMLink = "examples/OpenFOAM/incompressible/simpleFoam/windAroundBuildings";
//

function WindAroundBuildings() {
  const casePath = window.location.pathname
  const caseName = casePath.split("/").pop();
  const path = surrogatesPath + casePath

  useEffect(() => {
    document.title = "cfd.xyz | OF/incompressible/simpleFoam/windAroundBuildings"
  }, []);

  return (
    <div style={{ paddingBottom: 50}}>
      <ROMView
        threeDimensions={threeDimensions}
        initialPlanesCoords={initialPlanesCoords}
        stepPlanes={stepPlanes}
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
        dynamicVelocity={dynamicVelocity}
        initialVelocity={initialVelocity}
        dynamicAngle={dynamicAngle}
        initialAngle={initialAngle}
        minAngle={minAngle}
        maxAngle={maxAngle}
        stepAngle={stepAngle}
      />
    </div>
  );
}

export default WindAroundBuildings;
