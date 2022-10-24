import { useEffect } from 'react';

import GenericView  from './../../GenericView';

const simulationsPath = '/simulations';

// - Define case custom data
const initialPlanesCoords = [582135, 4785805, 960]
const dataPath = "/simulations/OF/incompressible/simpleFoam/turbineSiting/";
const vtpPath = dataPath + "body.vtp";
const vtuPath = dataPath + "internal.vtu";
const vtpVariable = "p";
const vtuVariable = "U";
const vtpTitle = "Pressure (m2/s2)";
const vtuTitle = "Velocity magnitude (m/s)";
const step = 10;
const codeLink = 'src/components/OF/Incompressible/SimpleFoam/TurbineSiting.jsx';
//

function TurbineSiting() {
  const casePath = window.location.pathname
  const caseName = casePath.split("/").pop();
  const path = simulationsPath + casePath

  useEffect(() => {
    document.title = "/OF/incompressible/simpleFoam/turbineSiting"
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

export default TurbineSiting;
