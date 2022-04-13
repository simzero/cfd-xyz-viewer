import { useEffect } from 'react';

import GenericView  from './../../GenericView';

// - Define case custom data
const MB=1.0;
const initialPlanesCoords = [0, 0, 0.005]
const dataPath = "/simulations/OF/incompressible/simpleFoam/mixerVessel2D/";
const vtpPath = dataPath + "body.vtp";
const vtuPath = dataPath + "internal.vtu";
const vtpVariable = "p";
const vtuVariable = "U";
const vtpTitle = "Pressure (m2/s2)";
const vtuTitle = "Velocity magnitude (m/s)";
const step = 0.0025;
const caseLink = 'src/components/OF/Incompressible/SimpleFoam/MixerVessel2D.jsx';
//

function MixerVessel2D() {
  useEffect(() => {
    document.title = "cfd.xyz | OF/incompressible/simpleFoam/mixerVessel2D"
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

export default MixerVessel2D;
