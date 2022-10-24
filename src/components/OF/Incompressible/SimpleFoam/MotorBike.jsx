import { useEffect } from 'react';

import GenericView  from './../../GenericView';

const simulationsPath = '/simulations';

// - Define case custom data
const initialPlanesCoords = [0, 0, 0.5]
const dataPath = "/simulations/OF/incompressible/simpleFoam/motorBike/";
const vtpPath = dataPath + "body.vtp";
const vtuPath = dataPath + "blabla.vtu";
const vtpVariable = "p";
const vtuVariable = "U";
const vtpTitle = "Pressure (m2/s2)";
const vtuTitle = "Velocity magnitude (m/s)";
const step = 0.1;
const codeLink = 'src/components/OF/Incompressible/SimpleFoam/MotorBike.jsx';
//

function MotorBike() {
  const casePath = window.location.pathname
  const caseName = casePath.split("/").pop();
  const path = simulationsPath + casePath

  useEffect(() => {
    document.title = "cfd.xyz | OF/incompressible/simpleFoam/motorBike"
  }, []);

  return (
    <div style={{ paddingBottom: 50}}>
      <GenericView
        path={path}
        vtuPath={vtuPath}
        vtuVariable={vtuVariable}
        vtuTitle={vtuTitle}
        vtpPath={vtpPath}
        vtpVariable={vtpVariable}
        vtpTitle={vtpTitle}
        initialPlanesCoords={initialPlanesCoords}
        step={step}
        codeLink={codeLink}
      />
    </div>
  );
}

export default MotorBike;
