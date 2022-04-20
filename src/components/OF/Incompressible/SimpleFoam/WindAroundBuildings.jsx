import { useEffect } from 'react';

import GenericView  from './../../GenericView';

// - Define case custom data
const MB=31.3;
const initialPlanesCoords = [120.0, 90.0, 30]
const dataPath = "/simulations/OF/incompressible/simpleFoam/windAroundBuildings/";
const vtpPath = dataPath + "body.vtp";
const vtuPath = dataPath + "internal.vtu";
const vtpVariable = "p";
const vtuVariable = "U";
const vtpTitle = "Pressure (m2/s2)";
const vtuTitle = "Velocity magnitude (m/s)";
const step = 5.0;
const codeLink = 'src/components/OF/Incompressible/SimpleFoam/WindAroundBuildings.jsx';
//

function WindAroundBuildings() {
  useEffect(() => {
    document.title = "cfd.xyz | OF/incompressible/simpleFoam/windAroundBuildings"
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
        codeLink={codeLink}
      />
    </div>
  );
}

export default WindAroundBuildings;
