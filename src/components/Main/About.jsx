import { useEffect } from 'react';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import { makeStyles } from '@mui/styles';
import { lightTheme, darkTheme } from './../theme';

function About() {
  useEffect(() => {
    document.title = "cfd.xyz | About"
  }, []);

  const localTheme = window.localStorage.getItem('theme') || "light";
  const theme = localTheme === 'light' ? lightTheme : darkTheme;
  const useStyles = makeStyles(theme);
  const classes = useStyles();

  return (
    <div className={classes.root}>
        <Box sx={{ flexGrow: 1 }}>
          <div
            className={classes.titleText}
            style={{ marginLeft: 20 }}
          >
              THE WEB
          </div>
          <div
            className={classes.bodyText}
            style={{ marginTop: 0, marginLeft: 20, marginRight: 0, marginBottom: 20}}
          >
            - cfd.xyz is an open-source React web app to efficiently and easily explore fluid dynamics problems for a wide range of parameters. The framework provides a proof of technology for OpenFOAM tutorials, showing the whole process from the generation of the surrogate models to the web browser. It also includes a standalone web tool for visualizing users' surrogate models by directly dragging and dropping the output folder of the ROM offline stage. Beyond the current proof of technology, this enables a collaborative effort for the implementation of OpenFOAM-based models in applications demanding real-time solutions such as digital twins and other digital transformation technologies.
          </div>
          <div
            className={classes.bodyText}
            style={{ marginTop: 0, marginLeft: 20, marginRight: 0, marginBottom: 20}}
          >
             - We aim with this development to create a common place where canonical and industrial CFD problems can be visualized and analyzed without carrying out a simulation, or as a preliminary step for optimizing parameters of new simulations. Having an open-source centralized service has several advantages from educational, optimization and reproducibility point of views. But also from a CO2 footprint perspective.
          </div>
          <div
            className={classes.bodyText}
            style={{ marginTop: 0, marginLeft: 20, marginRight: 0, marginBottom: 20}}
          >
            - The web app relies on the rom.js module, a JavaScript port of a set of open-source packages to solve the online stage of reduced-order models (ROM) generated by the ITHACA-FV tool. It can also be executed outside a web browser within a backend JavaScript runtime environment. Please visit and support the open-source packages used in this work: <a target="_blank" href="https://www.openfoam.com">OpenFOAM</a>,  <a target="_blank" href="https://github.com/mathLab/ITHACA-FV">ITHACA-FV</a>, <a target="_blank" href="https://www.kitware.com">Kitware</a>, <a target="_blank" href="https://eigen.tuxfamily.org">Eigen</a>, <a target="_blank" href="https://github.com/bgrimstad/splinter.git">Splinter</a>, <a target="_blank" href="https://emscripten.org">Emscripten</a>, <a target="_blank" href="https://mui.com">MUI</a>, <a target="_blank" href="https://reactjs.org">React</a>, and many others. Check a list of all the packages in the code repositories.
          </div>
          <div
            className={classes.bodyText}
            style={{ marginTop: 0, marginLeft: 20, marginRight: 0, marginBottom: 20}}
          >
           - This is a beta version, please handle it with care. Further features, optimizations and fixes are expected.
          </div>
          <div
            className={classes.bodyText}
            style={{ marginTop: 0, marginLeft: 20, marginRight: 0, marginBottom: 20}}
          >
            <div>- 3D view control keys: </div>
            <div> &nbsp;&nbsp; * Rotate: LEFT MOUSE</div>
            <div> &nbsp;&nbsp; * Pan: SHIFT + LEFT MOUSE</div>
            <div> &nbsp;&nbsp; * Spin: CTRL/ALT + LEFT MOUSE</div>
            <div> &nbsp;&nbsp; * Zoom: MOUSE WHEEL</div>
          </div>
          <div
            className={classes.titleText}
            style={{ marginLeft: 20 }}
          >
              THE CODE
          </div>
          <div
            className={classes.bodyText}
            style={{ marginTop: 0, marginLeft: 20, marginRight: 0, marginBottom: 40,  whiteSpace: "pre-wrap"}}
          >
             - cfd.xyz is an open-source web app. You can install it locally, fix bugs or add new features at the <a target="_blank" href="https://github.com/simzero-oss/cfd-xyz">cfd.xyz</a> or <a target="_blank" href="https://github.com/simzero-oss/rom-js">rom-js</a> GitHub repositories.
          </div>
          <div
            className={classes.titleText}
            style={{ marginLeft: 20 }}
          >
              THE LICENSES AND TRADEMARKS
          </div>
          <div
            className={classes.bodyText}
            style={{ marginTop: 0, marginLeft: 20, marginRight: 0, marginBottom: 40,  whiteSpace: "pre-wrap"}}
          >
            <div
              style={{ marginTop: 0, marginRight: 0, marginBottom: 20}}
            >
              - cfd.xyz code and images (excluding the logo) are mainly covered by <a target="_blank" href="https://github.com/simzero-oss/cfd-xyz/blob/main/LICENSE">MIT</a> and <a target="_blank" href="https://creativecommons.org/licenses/by/4.0">CC BY 4.0</a> licenses, respectively. Further details about the licenses can be found at <a target="_blank" href="https://github.com/simzero-oss/cfd-xyz#License">cfd.xyz licenses</a>. You can reuse this code under the terms of these licenses. Please cite this website and related repositories to help us to build more assets.
            </div>
            <div
              style={{ marginTop: 0, marginRight: 0, marginBottom: 20}}
            >
              - cfd.xyz logo and SIMZERO are exclusive trademarks. Their use is only allowed in the context of this web app and in compliance with trademark law. Adaptations or modifications of the cfd.xyz logo are not permitted.
            </div>
            <div>
              - This offering is not approved or endorsed by OpenCFD Limited, producer and distributor of the OpenFOAM software via www.openfoam.com, and owner of the OPENFOAM® and OpenCFD® trade marks.
            </div>
          </div>
          <div
            className={classes.titleText}
            style={{ marginLeft: 20 }}
          >
              THE AUTHORS
          </div>
          <div
            className={classes.bodyText}
            style={{ marginTop: 0, marginLeft: 20, marginRight: 0, marginBottom: 40,  whiteSpace: "pre-wrap"}}
          >
	      - cfd.xyz is developed and maintained by Carlos Peña-Monferrer<a target="_blank" href="https://orcid.org/0000-0003-3271-6399"> <img alt="ORCID logo" src="https://info.orcid.org/wp-content/uploads/2019/11/orcid_16x16.png" width="16" height="16"/></a> in collaboration with Carmen Diaz-Marin<a target="_blank" href="https://orcid.org/0000-0002-8924-9544"> <img alt="ORCID logo" src="https://info.orcid.org/wp-content/uploads/2019/11/orcid_16x16.png" width="16" height="16" /></a>. Please feel free to contact us by email (info@simzero.es) or joining the <a target="_blank" href="https://join.slack.com/t/cfd-xyz/shared_invite/zt-12uquswo6-FFVy95vRjfMF~~t8j~UBHA">Slack channel</a>. 
          </div>
          <div
            className={classes.titleText}
            style={{ marginLeft: 20 }}
          >
              THE FUNDING
          </div>
          <div
            className={classes.bodyText}
            style={{ marginTop: 0, marginLeft: 20, marginRight: 0, marginBottom: 20,  whiteSpace: "pre-wrap"}}
          >
             - cfd.xyz is free of charge, with no adds, no popups, no registration and no data collection. It will remain in that way.
          </div>
          <div
            className={classes.bodyText}
            style={{ marginTop: 0, marginLeft: 20, marginRight: 0, marginBottom: 40,  whiteSpace: "pre-wrap"}}
          >
             - This is a self-funded initiative. If you like the tool and the mission and want to help with new developments and server costs please <a target="_blank" href="https://www.paypal.com/donate/?hosted_button_id=KKB4LH96E59A4">donate</a> (PayPal).
          </div>
          <div
            className={classes.titleText}
            style={{ marginLeft: 20 }}
          >
              THE TERMS AND CONDITIONS
          </div>
          <div
            className={classes.bodyText}
            style={{ marginTop: 0, marginLeft: 20, marginRight: 0, marginBottom: 20,  whiteSpace: "pre-wrap"}}
          >
             - YOU AGREE THAT YOU USE THE SITE AND THE CONTENT AT YOUR OWN RISK, AND UNDERSTAND THAT THIS SERVICE IS PROVIDED TO YOU ON AN "AS IS" and "AS AVAILABLE" BASIS. THE SERVICE IS PROVIDED WITHOUT WARRANTIES OF ANY KIND, INCLUDING BUT NOT LIMITED TO CONTENT ACCURACY, RELIABILITY OR COMPLETENESS. WE SHALL NOT BE SUBJECT TO LIABILITY FOR TRUTH, ACCURACY OR COMPLETENESS OF ANY INFORMATION CONVEYED TO THE USER. IF YOUR USE OF THE SITE OR THE CONTENT RESULTS IN THE NEED FOR SERVICING OR REPLACING EQUIPMENT OR DATA, WE SHALL NOT BE RESPONSIBLE FOR THOSE COSTS.
          </div>
        </Box>
    </div>
  );
}

export default About;
