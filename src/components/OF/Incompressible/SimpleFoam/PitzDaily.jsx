// Copyright (c) 2022 Carlos Peña-Monferrer. All rights reserved.
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>. 

import { useState, useRef, useEffect } from 'react';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField'

import { makeStyles } from '@mui/styles';

import {Buffer} from 'buffer';

import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkXMLPolyDataReader from '@kitware/vtk.js/IO/XML/XMLPolyDataReader';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkColorMaps from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkScalarBarActor from '@kitware/vtk.js/Rendering/Core/ScalarBarActor';
import debounce from "lodash/debounce";
import { lightTheme, darkTheme } from './../../../theme';
import hexRgb from 'hex-rgb';
import rom from '@simzero/rom'
import Papa from 'papaparse'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro'

import useWindowOrientation from "use-window-orientation";
import {isMobile} from 'react-device-detect';
import PropagateLoader from "react-spinners/PropagateLoader";

const { ColorMode } = vtkMapper;

// TODO: redundand instances of vtkScalarBarActor to be removed
// when issue https://github.com/Kitware/vtk-js/issues/2111
// is fixed.

const initialTemperature = 20; // 1e-05
const minTemperature = -100;
const maxTemperature = 1000;
const stepTemperature = 50.0;
const initialVelocity = 10.0;
const minVelocity = 1.0;
const maxVelocity = 20.0;
const stepVelocity = 1.0;
const rootPath = '/surrogates/OF/incompressible/simpleFoam/pitzDaily/';

const temperatureToViscosity = (T) => {
  const a0 = 1.145757;
  const a1 = 0.005236;
  const a2 = 1.952*1e-06;

  return a0+a1*T+a2*Math.pow(T,2);
}

const dataToVector = (data) => {
  const vecVec = new rom.VectorVector();
  let rows = 0;
  let cols = 0;
  data.forEach(row => {
    const vec = new rom.Vector();
    row.forEach(value => {
      vec.push_back(value)
      if (rows === 0)
        cols++;
    });
    vecVec.push_back(vec)
    vec.delete()
    rows++;
  })
  return [vecVec, rows, cols];
}

const loadData = async (dataPath) => {
  const data = await readFile(rootPath + dataPath)
  const vector = dataToVector(data);
  return vector;
}

const readFile = async (filePath) => {
  return new Promise(resolve => {
    fetch(filePath).then(res => res.text())
    .then((data) => {
      Papa.parse(data, {
        download: false,
        delimiter: " ",
        dynamicTyping: true,
        skipEmptyLines: true,
        header: false,
        complete: results => {
          resolve(results.data);
        }
      })
   })
  })
};

function PitzDaily() {
  const { orientation, portrait, landscape } = useWindowOrientation();
  const initialPortrait = portrait;
  const vtkContainerRef = useRef(null);
  const context = useRef(null);
  const [temperatureValue, setTemperatureValue] = useState(null);
  const [ready, setIsReady] = useState(false);
  const [busyIncrement, setBusyIncrement] = useState(false);
  const [busyDecrement, setBusyDecrement] = useState(false);
  const [increment, setIncrement] = useState(false);
  const [decrement, setDecrement] = useState(false);
  const [doIncrement, setDoIncrement] = useState(false);
  const [doDecrement, setDoDecrement] = useState(false);
  const [busyIncrementU, setBusyIncrementU] = useState(false);
  const [busyDecrementU, setBusyDecrementU] = useState(false);
  const [incrementU, setIncrementU] = useState(false);
  const [decrementU, setDecrementU] = useState(false);
  const [doIncrementU, setDoIncrementU] = useState(false);
  const [doDecrementU, setDoDecrementU] = useState(false);
  const [velocityValue, setVelocityValue] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(null);
  const [sceneLoaded, setSceneLoaded] = useState(null);
  const [process, setProcess] = useState(10);
  const [showU, setShowU] = useState(false);
  const [showT, setShowT] = useState(false);

  const localTheme = window.localStorage.getItem('theme') || "light"
  const trackTheme = useState(window.localStorage.getItem('theme') || "light");
  const theme = localTheme === 'light' ? lightTheme : darkTheme;
  const useStyles = makeStyles(theme);
  const classes = useStyles();

  let backgroundLight = hexRgb(lightTheme.body, {format: 'array'});
  let backgroundDark = hexRgb(darkTheme.body, {format: 'array'});
  backgroundLight = backgroundLight.map(x => x / 255); 
  backgroundDark = backgroundDark.map(x => x / 255); 
  backgroundLight.pop();
  backgroundDark.pop();

  let textColorLight = lightTheme.vtkText.color;
  let textColorDark = darkTheme.vtkText.color;
  const textColorLoader = localTheme === 'light' ? lightTheme.bodyText.color : darkTheme.bodyText.color;

  let background = hexRgb(theme.body, {format: 'array'});
  background = background.map(x => x / 255); 
  background.pop();

  const initialize = async() => {
    if (!context.current) {
      setVelocityValue(initialVelocity);
      setTemperatureValue(initialTemperature);

      await rom.ready

      const P = await loadData('matrices/P_mat.txt');
      const M = await loadData('matrices/M_mat.txt');
      const K = await loadData('matrices/K_mat.txt');
      const B = await loadData('matrices/B_mat.txt');

      setProcess(25);

      const modes = await loadData('EigenModes_U_mat.txt');
      const coeffL2 = await loadData('matrices/coeffL2_mat.txt');
      const mu = await loadData('par.txt');

      const Nphi_u = B[1];
      const Nphi_p = K[2];
      const Nphi_nut = coeffL2[1];
      const N_BC = 1;

      const reduced = new rom.reducedSteady(Nphi_u + Nphi_p, Nphi_u + Nphi_p);

      reduced.Nphi_u(Nphi_u);
      reduced.Nphi_p(Nphi_p);
      reduced.Nphi_nut(Nphi_nut);
      reduced.N_BC(N_BC);
      reduced.addMatrices(P[0], M[0], K[0], B[0]);
      reduced.addModes(modes[0]);

      setProcess(50);

      (async () => {
        reduced.Nphi_nut(Nphi_nut);

        let indexes = []
        for (var j = 0; j < Nphi_u; j ++ ) {
          indexes.push(j);
        }

        await Promise.all(indexes.map(async (index) => {
          const C1Path = 'matrices/ct1_' + index + "_mat.txt"
          const C1 = await loadData(C1Path);
          reduced.addCt1Matrix(C1[0], index);
        }));

        setProcess(60);

        await Promise.all(indexes.map(async (index) => {
          const C2Path = 'matrices/ct2_' + index + "_mat.txt"
          const C2 = await loadData(C2Path);
          reduced.addCt2Matrix(C2[0], index);
        }));

        setProcess(70);

        await Promise.all(indexes.map(async (index) => {
          const CPath = 'matrices/C' + index + "_mat.txt"
          const C = await loadData(CPath);
          reduced.addCMatrix(C[0], index);
        }));

        setProcess(90);

        reduced.preprocess();
        reduced.nu(temperatureToViscosity(initialTemperature)*1e-05);
        reduced.setRBF(mu[0], coeffL2[0]);
        setProcess(100);
        context.current = { reduced };
        setIsReady(true);
      })();
    }
  }

  const resetCamera = () => {
    if (context.current) {
     const { fullScreenRenderer, focalPoint, cameraPosition, renderer, renderWindow } = context.current;
     renderer.getActiveCamera().setProjectionMatrix(null);
     const offset = Math.sqrt( (cameraPosition[0]-focalPoint[0])**2 + (cameraPosition[1]-focalPoint[1])**2 + (cameraPosition[2]-focalPoint[2])**2 )
     renderer.getActiveCamera().setPosition(cameraPosition[0], cameraPosition[1], cameraPosition[2] + offset);
     renderer.getActiveCamera().setViewUp(0.0, 1.0, 0.0)	    
     renderer.resetCamera();
     fullScreenRenderer.resize();
     if (portrait) 
       renderer.getActiveCamera().zoom(0.55);
     else
       renderer.getActiveCamera().zoom(1.3);
     renderWindow.render();
    }    
  }

  const setScene = (portrait, context, vtkContainerRef, theme) => {
    const { reduced } = context.current;
    const reader = vtkXMLPolyDataReader.newInstance();
    const actor = vtkActor.newInstance();
    const scalarBarActor = vtkScalarBarActor.newInstance();
    const lookupTable = vtkColorTransferFunction.newInstance();
    const mapper = vtkMapper.newInstance({
      interpolateScalarsBeforeMapping: true,
      colorByArrayName: "uRec",
      colorMode: ColorMode.DEFAULT,
      scalarMode: 'pointData',
      useLookupTableScalarRange: true,
      lookupTable,
    });
    actor.setMapper(mapper);
    mapper.setLookupTable(lookupTable);
    scalarBarActor.setVisibility(true);
    const mystyle = {
      margin: '0',
      padding: '0',
      paddingBottom: '50',
      position: 'absolute',
      top: '0',
      left: '0',
      width: '99%',
      height: '93%',
      overflow: 'hidden',
    };
    const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
      containerStyle: mystyle,
      background,
      rootContainer: vtkContainerRef.current,
    });
    const renderer = fullScreenRenderer.getRenderer();
    renderer.setBackground(background);
    const renderWindow = fullScreenRenderer.getRenderWindow();
    const preset = vtkColorMaps.getPresetByName('erdc_rainbow_bright');
    lookupTable.setVectorModeToMagnitude();
    lookupTable.applyColorMap(preset);
    lookupTable.updateRange();

    const scalarBarActorStyle = {
      paddingBottom: 30,
      fontColor: theme.vtkText.color,
      fontStyle: 'normal',
      fontFamily: theme.vtkText.fontFamily
    };
    reduced.solveOnline(initialVelocity);
    const polydata_string = reduced.unstructuredGridToPolyData();
    // TODO: parse directly as buffer or parse as a string...
    var buf = Buffer.from(polydata_string, 'utf-8');
    reader.parseAsArrayBuffer(buf);
    let polydata = reader.getOutputData(0);

    renderer.addActor(scalarBarActor);
    renderer.addActor(actor);

    reduced.nu(temperatureToViscosity(initialTemperature)*1e-05);
    const newU = reduced.reconstruct();

    var nCells = polydata.getNumberOfPoints();
    polydata.getPointData().setActiveScalars("uRec");

    const array = vtkDataArray.newInstance({ name: 'uRec', size: nCells*3, numberOfComponents: 3, dataType: 'Float32Array' });
    for (let i = 0; i < nCells; i++) {
      let v =[newU[i], newU[i + nCells], newU[i + nCells * 2]];
      array.setTuple(i, v)
    }
    array.modified();
    array.modified();

    polydata.getPointData().addArray(array);

    var activeArray = polydata.getPointData().getArray("uRec");
    const dataRange = [].concat(activeArray ? activeArray.getRange() : [0, 1]);
    lookupTable.setMappingRange(dataRange[0], dataRange[1]);
    lookupTable.updateRange();
    mapper.setScalarModeToUsePointFieldData();
    mapper.setScalarRange(dataRange[0],dataRange[1]);
    mapper.setColorByArrayName('uRec');
    mapper.setInputData(polydata);
    scalarBarActor.setScalarsToColors(mapper.getLookupTable());
    scalarBarActor.setAxisLabel("Velocity magnitude (m/s)");
    lookupTable.updateRange();
    scalarBarActor.modified();
    renderer.resetCamera();

    if (portrait) 
      renderer.getActiveCamera().zoom(0.55);
    else
      renderer.getActiveCamera().zoom(1.3);

    scalarBarActor.setVisibility(false);

    scalarBarActor.setAxisTextStyle(scalarBarActorStyle);
    scalarBarActor.setTickTextStyle(scalarBarActorStyle);
    scalarBarActor.modified();
    scalarBarActor.setVisibility(true);
    renderWindow.modified();
    renderWindow.render();

    const camera = renderer.getActiveCamera();
    const focalPoint = [].concat(camera ? camera.getFocalPoint() : [0, 1, 2]);
    const cameraPosition = [].concat(camera ? camera.getPosition() : [0, 1, 2]);

    context.current = {
      focalPoint,
      cameraPosition,
      reduced,
      reader,
      fullScreenRenderer,
      renderWindow,
      renderer,
      lookupTable,
      polydata,
      actor,
      scalarBarActor,
      mapper,
    };
    setSceneLoaded(true);
  }

  const takeScreenshot = () => {
    if (context.current) {
     const { renderWindow } = context.current;
     renderWindow.captureImages()[0].then(
       (image) => {
         (async () => {
           const blob = await (await fetch(image)).blob(); 
           var a = document.createElement("a");
           a.innerHTML = 'download';
           a.href = URL.createObjectURL(blob);
           a.download = "pitzDaily_T_" + temperatureValue + "_U_" + velocityValue + ".png";
           a.click();
         })();
       }
     );
    }    
  }

  const downloadData = () => {
    if (context.current) {
      const { reduced } = context.current;
      const data_string = reduced.exportUnstructuredGrid();
      var blob = new Blob([data_string], {
        type: 'text/plain'
      });
       var a = document.createElement("a");
       a.innerHTML = 'download';
       a.href = URL.createObjectURL(blob);
       a.download = "pitzDaily_T_" + temperatureValue + "_U_" + velocityValue + ".vtu";
       a.click();
    }    
  }

  const calculateNewField = () => {
    if (context.current) {
      const { lookupTable, mapper, polydata, reduced, renderWindow } = context.current;
      reduced.nu(temperatureToViscosity(temperatureValue)*1e-05);
      reduced.solveOnline(velocityValue);
      const newU = reduced.reconstruct();
      polydata.getPointData().removeArray('uRec');
      var nCells = polydata.getNumberOfPoints();
      const array = vtkDataArray.newInstance({ name: 'uRec', size: nCells*3, numberOfComponents: 3, dataType: 'Float32Array' });
      for (let i = 0; i < nCells; i++) {
        let v =[newU[i], newU[i + nCells], newU[i + nCells * 2]];
        array.setTuple(i, v)
      }
      array.modified();
      polydata.getPointData().setScalars(array)
      polydata.getPointData().addArray(array);
      polydata.getPointData().setActiveScalars("uRec");
      const dataRange = [].concat(array ? array.getRange() : [0, 1]);
      lookupTable.setMappingRange(dataRange[0], dataRange[1]);
      lookupTable.updateRange();
      mapper.setScalarRange(dataRange[0],dataRange[1]);
      mapper.update();
      renderWindow.render();
    };
  };

  const myFunction = (eventSrcDesc, newValue) => {
    // console.log({ eventSrcDesc, newValue });
  };

  const handleSetShowU = () => {
    setShowU(!showU);
    if (!showU)
      setShowT(false);
  };

  const handleSetShowT = () => {
    setShowT(!showT);
    if (!showT)
      setShowU(false);
  };

  const handleTemperatureChange = (event, newValue) => {
    setTemperatureValue(newValue);
    stateDebounceMyFunction("slider-tate", newValue);
  };

  const handleTemperatureInput = (event, newValue) => {
    newValue = Math.min(Math.max(newValue, minTemperature), maxTemperature);
    setTemperatureValue(newValue);
  };

  const handleVelocityInput = (event, newValue) => {
    newValue = Math.min(Math.max(newValue, minVelocity), maxVelocity);
    setVelocityValue(newValue);
  };

  const handleVelocityChange = (event, newValue) => {
    setVelocityValue(newValue);
    stateDebounceMyFunction("slider-tate", newValue);
  };

  const handleIncrement = () => {
    let newValue = temperatureValue + stepTemperature;
    newValue = Math.min(Math.max(newValue, minTemperature), maxTemperature);
    setTemperatureValue(newValue);
    calculateNewField();
    setBusyIncrement(false);
  }

  const handleDecrement = () => {
    let newValue = temperatureValue - stepTemperature;
    newValue = Math.min(Math.max(newValue, minTemperature), maxTemperature);
    setTemperatureValue(newValue);
    calculateNewField();
    setBusyDecrement(false);
  }

  const handleIncrementU = () => {
    let newValue = velocityValue + stepVelocity;
    newValue = Math.min(Math.max(newValue, minVelocity), maxVelocity);
    setVelocityValue(newValue);
    calculateNewField();
    setBusyIncrementU(false);
  }

  const handleDecrementU = () => {
    let newValue = velocityValue - stepVelocity;
    newValue = Math.min(Math.max(newValue, minVelocity), maxVelocity);
    setVelocityValue(newValue);
    calculateNewField();
    setBusyDecrementU(false);
  }

  const [stateDebounceMyFunction] = useState(() =>
    debounce(myFunction, 300, {
      leading: false,
      trailing: true
    })
  );

  useEffect(() => {
    document.title = "cfd.xyz | OF/incompressible/simpleFoam/pitzDaily"
  }, []);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (context.current)
     resetCamera();
  }, [orientation]);

  useEffect(() => {
    if (context.current && !busyIncrement)
    {
      setBusyIncrement(true);
      setDoIncrement(!doIncrement);
    }
  }, [increment, setBusyIncrement]);

  useEffect(() => {
    if (context.current && !busyIncrementU)
    {
      setBusyIncrementU(true);
      setDoIncrementU(!doIncrementU);
    }
  }, [incrementU]);

  useEffect(() => {
    if (context.current && !busyDecrement)
    {
      setBusyDecrement(true);
      setDoDecrement(!doDecrement);
    }
  }, [decrement]);

  useEffect(() => {
    if (context.current && !busyDecrementU)
    {
      setBusyDecrementU(true);
      setDoDecrementU(!doDecrementU);
    }
  }, [decrementU]);

  useEffect(() => {
    if (context.current)
    {
      handleIncrement();
    }
  }, [doIncrement]);

  useEffect(() => {
    if (context.current)
    {
      handleDecrement();
    }
  }, [doDecrement]);

  useEffect(() => {
    if (context.current)
    {
      handleIncrementU();
    }
  }, [doIncrementU]);

  useEffect(() => {
    if (context.current)
    {
      handleDecrementU();
    }
  }, [doDecrementU]);

  useEffect(() => {
    if (context.current) {
      const localTheme = window.localStorage.getItem('theme') || "light"
      const initialTheme = localTheme === 'light' ? lightTheme : darkTheme;

      setScene(initialPortrait, context, vtkContainerRef, initialTheme);
      setSceneLoaded(true);
    }
  }, [dataLoaded, initialPortrait]);

  useEffect(() => {
    if (context.current && ready) {
      (async () => {
        const { reduced } = context.current;
        const vtuPath = rootPath + 'pitzDaily.vtu';
        const data = await fetch(vtuPath);
        const response = await data.text();
        await reduced.readUnstructuredGrid(response);
        setDataLoaded(true);
      })();
    }
  }, [ready]);

  useEffect(() => {
    if (context.current) {
      calculateNewField();
    }
  }, [temperatureValue, velocityValue]);

  useEffect(() => {
    if (context.current) {
      const { mapper, renderer, renderWindow, scalarBarActor } = context.current;
      if (renderWindow) {
        const background = localTheme === 'light' ? backgroundLight : backgroundDark;
        const textColor = localTheme === 'light' ? textColorLight : textColorDark;

        const scalarBarActorStyle1 = {
          paddingBottom: 30,
          fontColor: textColor,
          fontStyle: 'normal',
          fontFamily: theme.vtkText.fontFamily
        };

        renderer.setBackground(background);
        scalarBarActor.setAxisTextStyle(scalarBarActorStyle1);
        scalarBarActor.setTickTextStyle(scalarBarActorStyle1);
        scalarBarActor.setAxisLabel("Velocity magnitude (m/s)");
        scalarBarActor.setScalarsToColors(mapper.getLookupTable());
        scalarBarActor.modified();
        renderWindow.render();
      }
    }
  }, [trackTheme, localTheme, textColorLight, textColorDark, backgroundLight, backgroundDark, theme.vtkText.fontFamily]);

  useEffect(() => {
    return () => {
      if (context.current) {
        const { actor, reader, reduced, renderer, renderWindow, fullScreenRenderer, lookupTable, polydata, scalarBarActor, mapper } = context.current;
        actor.delete();
        fullScreenRenderer.delete();
        lookupTable.delete();
        mapper.delete();
        polydata.delete();
        reader.delete();
        reduced.delete();
        renderer.delete();
        renderWindow.delete();
        scalarBarActor.delete();
        context.current = null;
      }
    };
  }, []);


  return (
    <div style={{ paddingBottom: 80}}>
      <div ref={vtkContainerRef}>
        {!dataLoaded
          ? <div
              style={{
                position: 'absolute', left: '50%', top: '35%',
                transform: 'translate(-50%, -35%)'
              }}
              className={classes.bodyText}
            >
              <div
                style={{
                  textAlign: 'center',
                  paddingBottom: 20,
                }}
              >
                LOADING AND READING DATA {process} %
              </div>
              <div
                style={{
                 textAlign: 'center'
                }}
              >
                <PropagateLoader color={textColorLoader}/>
              </div>
            </div>
          : <div
              style={{
                position: 'absolute', left: '50%', top: '35%',
                transform: 'translate(-50%, -35%)'
              }}
              className={classes.bodyText}
            >
              <div
                style={{
                  textAlign: 'center',
                  paddingBottom: 20,
                }}
              >
                SETTING UP THE SCENE
              </div>
              <div
                style={{
                  textAlign: 'center'
                }}
              >
                <PropagateLoader color={textColorLoader}/>
              </div>
            </div>
        }
      </div>
      {(!sceneLoaded && !isMobile) &&
        <div
          style={{
            position: 'absolute', left: '50%', top: '70%',
            transform: 'translate(-50%, -50%)'
          }}
          className={classes.bodyText}
        >
          <div
            style={{
              textAlign: 'left',
              paddingBottom: 0,
              paddingRight: 0,
              paddingTop: 0,
              paddingLeft: 0,
            }}
          >
            <div>CONTROL VIEW TIPS:</div>
            <div>* ROTATE: LEFT MOUSE</div>
            <div>* PAN: LEFT MOUSE + SHIFT</div>
            <div>* SPIN: LEFT MOUSE + CTRL/ALT</div>
            <div>* ZOOM: MOUSE WHEEL</div>
          </div>
        </div>
      }
      {(sceneLoaded) &&
        <div>
          <div
            style={{
              paddingBottom: 80,
              position: 'absolute',
              top: '60px',
              right: landscape ? '40px' : '20px',
              backgroundColor: background,
              padding: '5px',
              marginRight: '2%',
              border: '1px solid rgba(125, 125, 125)',
            }}
          >
            <Box className={classes.link} sx={{ height: '34px', width: '34px' }} onClick={downloadData}>
              <FontAwesomeIcon
                style={{width: '32px', height: '32px'}}
                icon={solid('download')}
              />
            </Box>
          </div>
          <div
            style={{
              paddingBottom: 60,
              position: 'absolute',
              top: '60px',
              right: landscape ? '90px' : '70px',
              backgroundColor: background,
              padding: '5px',
              marginRight: '2%',
              border: '1px solid rgba(125, 125, 125)',
            }}
          >
            <Box className={classes.link} sx={{ height: '34px', width: '34px' }} onClick={takeScreenshot}>
              <FontAwesomeIcon
                style={{width: '32px', height: '32px'}}
                icon={solid('camera-retro')}
              />
            </Box>
          </div>
          <div
            style={{
              paddingBottom: 60,
              position: 'absolute',
              top: '60px',
              right: landscape ? '140px' : '120px',
              backgroundColor: background,
              padding: '5px',
              marginRight: '2%',
              border: '1px solid rgba(125, 125, 125)',
            }}
          >
            <Box className={classes.link} sx={{ height: '34px', width: '34px' }} onClick={resetCamera}>
              <FontAwesomeIcon
                style={{width: '32px', height: '32px'}}
                icon={solid('undo-alt')}
              />
            </Box>
          </div>
          {(isMobile && !showU) &&
            <div
              style={{
                paddingBottom: 60,
                position: 'absolute',
                top: '60px',
                right: landscape ? '190px' : '170px',
                backgroundColor: background,
                padding: '5px',
                marginRight: '2%',
                border: '1px solid rgba(125, 125, 125)',
              }}
            >
              <Box
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "20px"
                }}
                className={classes.link}
                sx={{ height: '34px', width: '34px' }}
                onClick={handleSetShowU}
              >
                U
              </Box>
            </div>
          }
          {(isMobile && showU) &&
            <div
              style={{
                paddingBottom: 60,
                position: 'absolute',
                top: '60px',
                right: landscape ? '190px' : '170px',
                padding: '5px',
                marginRight: '2%',
                border: '1px solid rgba(125, 125, 125)',
              }}
              className={classes.viewButtonsPressed}
            >
              <Box
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "20px"
                }}
                className={classes.link}
                sx={{ height: '34px', width: '34px' }}
                onClick={handleSetShowU}
              >
                U
              </Box>
            </div>
          }
          {(isMobile && !showT) &&
            <div
              style={{
                paddingBottom: 60,
                position: 'absolute',
                top: '60px',
                right: landscape ? '240px' : '220px',
                backgroundColor: background,
                padding: '5px',
                marginRight: '2%',
                border: '1px solid rgba(125, 125, 125)',
              }}
            >
              <Box
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "20px"
                }}
                className={classes.link}
                sx={{ height: '34px', width: '34px' }}
                onClick={handleSetShowT}>
                  T
              </Box>
            </div>
          }
          {(isMobile && showT) &&
            <div
              style={{
                paddingBottom: 60,
                position: 'absolute',
                top: '60px',
                right: landscape ? '240px' : '220px',
                padding: '5px',
                marginRight: '2%',
                border: '1px solid rgba(125, 125, 125)',
              }}
              className={classes.viewButtonsPressed}
            >
              <Box
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "20px"
                }}
                className={classes.link}
                sx={{ height: '34px', width: '34px' }}
                onClick={handleSetShowT}
              >
                T
              </Box>
            </div>
          }
        </div>
        }
      {(isMobile && showT && landscape) &&
      <div
        style={{
          position: 'absolute',
          top: landscape ? '60px' : '120px',
          left: '20px',
          backgroundColor: background,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: landscape ? '0px' : '0px',
            padding: '5px',
            border: '1px solid',
          }}
          className={!busyDecrement ? classes.link : classes.viewButtonsPressed}
        >
          <Box
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "800",
              fontSize: "20px"
            }}
	    sx={{ height: '34px', width: '34px' }}
            onClick={
              (!busyDecrement
                ?
                  () => {
                    setDecrement(!decrement)
                  }
                :
                  (e) => {
                    e.preventDefault()
                  }
	      )
	    }
          >
            -
          </Box>
        </div>
        <div
          style={{
            position: 'absolute',
            left: landscape ? '50px' : '220px',
          }}
        >
        <TextField
          id="T"
          variant="outlined"
          align="right"
          className={classes.textField}
          label="°C"
          type="number"
          inputProps={{
            style:
            {
              fontSize: 14,
              height: '13px',
              width: '34px',
              textAlign: "right"
	    },
            inputMode: 'decimal',
            pattern: '[0-9]*'
	  }}
          // helperText={temperatureValue > 100 ? "Out of range." : " "}
          value={temperatureValue}
          onChange={(event) => {
            handleTemperatureInput(event,event.target.value);
            event.preventDefault();
          }}
        />
        </div>
        <div
          style={{
            paddingBottom: 60,
            position: 'absolute',
            left: landscape ? '117px' : '220px',
            padding: '5px',
            border: '1px solid',
          }}
          className={!busyIncrement ? classes.link : classes.viewButtonsPressed}
        >
          <Box
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "800",
              fontSize: "20px"
            }}
	    sx={{ height: '34px', width: '34px' }}
            onClick={
              (!busyIncrement
                ?
                  () => {
                    setIncrement(!increment)
                  }
                :
                  (e) => {
                    e.preventDefault()
                  }
	      )
	    }
          >
            +
          </Box>
        </div>
      </div>
      }
      {(isMobile && showU && landscape) &&
      <div
        style={{
          position: 'absolute',
          top: landscape ? '60px' : '120px',
          left: '20px',
          backgroundColor: background,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: landscape ? '0px' : '0px',
            padding: '5px',
            border: '1px solid',
          }}
          className={!busyDecrementU ? classes.link : classes.viewButtonsPressed}
        >
          <Box
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "800",
              fontSize: "20px"
            }}
	    sx={{ height: '34px', width: '34px' }}
            onClick={
              (!busyDecrementU
                ?
                  () => {
                    setDecrementU(!decrementU)
                  }
                :
                  (e) => {
                    e.preventDefault()
                  }
	      )
	    }
          >
            -
          </Box>
        </div>
        <div
          style={{
            position: 'absolute',
            left: landscape ? '50px' : '220px',
          }}
        >
        <TextField
          id="U"
          variant="outlined"
          align="right"
          className={classes.textField}
          label="m/s"
          type="number"
          inputProps={{
            style:
            {
              fontSize: 14,
              height: '13px',
              width: '34px',
              textAlign: "right"
	    },
            inputMode: 'decimal',
            pattern: '[0-9]*'
	  }}
          // helperText={temperatureValue > 100 ? "Out of range." : " "}
          value={velocityValue}
          onChange={(event) => {
            handleVelocityInput(event,event.target.value);
            event.preventDefault();
          }}
        />
        </div>
        <div
          style={{
            paddingBottom: 60,
            position: 'absolute',
            left: landscape ? '117px' : '220px',
            padding: '5px',
            border: '1px solid',
          }}
          className={!busyIncrementU ? classes.link : classes.viewButtonsPressed}
        >
          <Box
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "800",
              fontSize: "20px"
            }}
	    sx={{ height: '34px', width: '34px' }}
            onClick={
              (!busyIncrementU
                ?
                  () => {
                    setIncrementU(!incrementU)
                  }
                :
                  (e) => {
                    e.preventDefault()
                  }
	      )
	    }
          >
            +
          </Box>
        </div>
      </div>
      }
      {(isMobile && showT && portrait) &&
      <div
        style={{
          position: 'absolute',
          top: '115px',
          right: '28px',
          backgroundColor: background,
        }}
      >
        <div
          style={{
            paddingBottom: 60,
            position: 'absolute',
            right: '0px',
            padding: '5px',
            border: '1px solid',
          }}
          className={!busyIncrement ? classes.link : classes.viewButtonsPressed}
        >
          <Box
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "800",
              fontSize: "20px"
            }}
	    sx={{ height: '34px', width: '34px' }}
            onClick={
              (!busyIncrement
                ?
                  () => {
                    setIncrement(!increment)
                  }
                :
                  (e) => {
                    e.preventDefault()
                  }
	      )
	    }
          >
            +
          </Box>
        </div>
        <div
          style={{
            position: 'absolute',
            right: '50px'
          }}
        >
        <TextField
          id="T"
          variant="outlined"
          align="right"
          className={classes.textField}
          label="°C"
          type="number"
          inputProps={{
            style:
            {
              paddingRight: 4,
              paddingLeft: 4,
              fontSize: 14,
              height: '13px',
              width: '38px',
              textAlign: "right"
	    },
            inputMode: 'decimal',
            pattern: '[0-9]*'
	  }}
          // helperText={temperatureValue > 100 ? "Out of range." : " "}
          value={temperatureValue}
          onChange={(event) => {
            handleTemperatureInput(event,event.target.value);
            event.preventDefault();
          }}
        />
        </div>
        <div
          style={{
            position: 'absolute',
            right: '100px',
            padding: '5px',
            border: '1px solid',
          }}
          className={!busyDecrement ? classes.link : classes.viewButtonsPressed}
        >
          <Box
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "800",
              fontSize: "20px"
            }}
	    sx={{ height: '34px', width: '34px' }}
            onClick={
              (!busyDecrement
                ?
                  () => {
                    setDecrement(!decrement)
                  }
                :
                  (e) => {
                    e.preventDefault()
                  }
	      )
	    }
          >
            -
          </Box>
        </div>
      </div>
      }
      {(isMobile && showU && portrait) &&
      <div
        style={{
          position: 'absolute',
          top: '115px',
          right: '28px',
          backgroundColor: background,
        }}
      >
        <div
          style={{
            paddingBottom: 60,
            position: 'absolute',
            right: '0px',
            padding: '5px',
            border: '1px solid',
          }}
          className={!busyIncrementU ? classes.link : classes.viewButtonsPressed}
        >
          <Box
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "800",
              fontSize: "20px"
            }}
	    sx={{ height: '34px', width: '34px' }}
            onClick={
              (!busyIncrementU
                ?
                  () => {
                    setIncrementU(!incrementU)
                  }
                :
                  (e) => {
                    e.preventDefault()
                  }
	      )
	    }
          >
            +
          </Box>
        </div>
        <div
          style={{
            position: 'absolute',
            right: '50px'
          }}
        >
        <TextField
          id="T"
          variant="outlined"
          align="right"
          className={classes.textField}
          label="m/s"
          type="number"
          inputProps={{
            style:
            {
              paddingRight: 4,
              paddingLeft: 4,
              fontSize: 14,
              height: '13px',
              width: '38px',
              textAlign: "right"
	    },
            inputMode: 'decimal',
            pattern: '[0-9]*'
	  }}
          // helperText={temperatureValue > 100 ? "Out of range." : " "}
          value={velocityValue}
          onChange={(event) => {
            handleVelocityInput(event,event.target.value);
            event.preventDefault();
          }}
        />
        </div>
        <div
          style={{
            position: 'absolute',
            right: '100px',
            padding: '5px',
            border: '1px solid',
          }}
          className={!busyDecrementU ? classes.link : classes.viewButtonsPressed}
        >
          <Box
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "800",
              fontSize: "20px"
            }}
	    sx={{ height: '34px', width: '34px' }}
            onClick={
              (!busyDecrementU
                ?
                  () => {
                    setDecrementU(!decrementU)
                  }
                :
                  (e) => {
                    e.preventDefault()
                  }
	      )
	    }
          >
            -
          </Box>
        </div>
      </div>
      }
      {(!isMobile && sceneLoaded) &&
      <div
        style={{
          paddingTop: '100px',
          paddingBottom: 60,
          padding: 10,
          position: 'absolute',
          top: '60px',
          left: '20px',
          backgroundColor: background,
          border: '1px solid rgba(125, 125, 125)',
        }}
      >
        <div>
          <div style={{marginTop: '2%'}}>
            <Box sx={{ width: 300 }}>
              <Slider
                className={classes.slider}
                defaultValue={initialTemperature}
                onChange={handleTemperatureChange}
                step={1}
                min={minTemperature}
                max={maxTemperature}
                valueLabelDisplay="on"
              />
            </Box>
          </div>
          <div className={classes.vtkText}>
            Temperature (°C)
          </div>
          <div style={{marginTop: '10%'}}>
            <Box sx={{ width: 300 }}>
              <Slider
                className={classes.slider}
                defaultValue={initialVelocity}
                onChange={handleVelocityChange}
                step={0.1}
                min={1}
                max={20.0}
                valueLabelDisplay="on"
              />
            </Box>
          </div>
          <div className={classes.vtkText}>
            Inlet velocity (m/s)
          </div>
        </div>
      </div>
      }
    </div>
  );
}

export default PitzDaily;
