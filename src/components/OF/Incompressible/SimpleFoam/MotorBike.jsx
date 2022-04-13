import { useEffect } from 'react';

import GenericView  from './../../GenericView';

// - Define case custom data
const MB=62.6;
const initialPlanesCoords = [0, 0, 0.5]
const dataPath = "/simulations/OF/incompressible/simpleFoam/motorBike/";
const vtpPath = dataPath + "body.vtp";
const vtuPath = dataPath + "internal.vtu";
const vtpVariable = "p";
const vtuVariable = "U";
const vtpTitle = "Pressure (m2/s2)";
const vtuTitle = "Velocity magnitude (m/s)";
const step = 0.1;
const caseLink = 'src/components/OF/Incompressible/SimpleFoam/MotorBike.jsx';
//

function MotorBike() {
  useEffect(() => {
    document.title = "cfd.xyz | OF/incompressible/simpleFoam/motorBike"
  }, []);

  return (
    <div style={{ paddingBottom: 50}}>
      <GenericView
        vtuPath={vtuPath}
        vtuVariable={vtuVariable}
        vtuTitle={vtuTitle}
        vtpPath={vtpPath}
        vtpVariable={vtpVariable}
        vtpTitle={vtpTitle}
        MB={MB}
        initialPlanesCoords={initialPlanesCoords}
        step={step}
        caseLink={caseLink}
      />
    </div>
  );
}

export default MotorBike;
