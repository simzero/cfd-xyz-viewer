// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>. 

import { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import Tooltip from '@mui/material/Tooltip'

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
import vtkOutlineFilter from '@kitware/vtk.js/Filters/General/OutlineFilter';

import debounce from "lodash/debounce";
import { lightTheme, darkTheme } from './../theme';
import Fader from "../Main/Fader";
import hexRgb from 'hex-rgb';
import rom from '@simzero/rom'
import Papa from 'papaparse'
import jszip from 'jszip'
import JSZipUtils from 'jszip-utils'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro'
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LayersIcon from '@mui/icons-material/Layers';
import CodeIcon from '@mui/icons-material/Code';
import GroupsIcon from '@mui/icons-material/Groups';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import useWindowOrientation from "use-window-orientation";
import {isMobile} from 'react-device-detect';
import PropagateLoader from "react-spinners/PropagateLoader";

const { ColorMode } = vtkMapper;

// TODO: redundand instances of vtkScalarBarActor to be removed
// when issue https://github.com/Kitware/vtk-js/issues/2111
// is fixed.

let dataRangeX, dataRangeY, dataRangeZ;

const repoViewer = 'https://github.com/simzero-oss/cfd-xyz-viewer/blob/main/'
const repoROM = 'https://github.com/simzero-oss/rom-js/blob/main/'

const messages = [
  'Please wait until the setting up has completely finished. It might take up to 2 min for some mobiles and cases',
  'Try cfd.xyz on a desktop computer for a better performance and user experience',
  'We are working on improving loading times. If you found a bug or this takes unusually long, please open an issue at: https://github.com/simzero-oss/cfd-xyz-viewer/issues/new',
];

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


const readFile = async (buffer) => {
  return new Promise(resolve => {
    Papa.parse(atob(buffer), {
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
};

const loadData = async (zipFiles, filename) => {
  const item = zipFiles.files[filename]
  const buffer = Buffer.from(await item.async('arrayBuffer')).toString('base64');
  const data = await readFile(buffer);
  const vector = dataToVector(data);

  return vector;
}

const ROMView = ({
    caseName,
    path,
    threeDimensions=false,
    initialPlanesCoords=[0, 0, 0],
    stepPlanes,
    ROMLink,
    viewerLink,
    stabilization,
    initialZoomLandscape,
    initialZoomPortrait,
    offsetY,
    dynamicTemperature,
    initialTemperature,
    minTemperature,
    maxTemperature,
    stepTemperature,
    dynamicVelocity,
    initialVelocity,
    minVelocity,
    maxVelocity,
    stepVelocity,
    dynamicAngle,
    initialAngle,
    minAngle,
    maxAngle,
    stepAngle,
  }) => {

  const { orientation, portrait, landscape } = useWindowOrientation();
  const initialPortrait = portrait;
  const vtkContainerRef = useRef(null);
  const context = useRef(null);
  const [authorsTooltip, setAuthorsTooltipOpen] = useState(false);
  const [codeTooltip, setCodeTooltipOpen] = useState(false);
  const [authors, setAuthors] = useState("");
  const [temperatureValue, setTemperatureValue] = useState(null);
  const [stepX,setStepX] = useState(stepPlanes);
  const [stepY,setStepY] = useState(stepPlanes);
  const [stepZ,setStepZ] = useState(stepPlanes);
  const [ready, setIsReady] = useState(false);
  const [velocityValue, setVelocityValue] = useState([null, null]);
  const [angleValue, setAngleValue] = useState(initialAngle);
  const [dataLoaded, setDataLoaded] = useState(null);
  const [dataDownloaded, setDataDownloaded] = useState(null);
  const [sceneLoaded, setSceneLoaded] = useState(null);
  const [process, setProcess] = useState(10);
  const [planeXValue, setPlaneXValue] = useState(initialPlanesCoords[0]);
  const [planeYValue, setPlaneYValue] = useState(initialPlanesCoords[1]);
  const [planeZValue, setPlaneZValue] = useState(initialPlanesCoords[2]);
  const [boundsTest, setBoundsTest] = useState([0, 0, 0, 0, 0, 0]);
  const [showU, setShowU] = useState(true);
  const [showPlanes, setShowPlanes] = useState(false);
  const [showPlaneX, setShowPlaneX] = useState(true);
  const [showPlaneY, setShowPlaneY] = useState(true);
  const [showPlaneZ, setShowPlaneZ] = useState(true);
  const [vtpData, setVtpData] = useState(null);

  const debounceTime = (threeDimensions || isMobile) ? 500 : 1;

  const localTheme = window.localStorage.getItem('theme') || "light"
  const trackTheme = useState(window.localStorage.getItem('theme') || "light");
  const theme = localTheme === 'light' ? lightTheme : darkTheme;
  const mainSecondaryColor = theme.palette.primary2Color;
  const useStyles = makeStyles(theme);
  const classes = useStyles();

  const link = repoViewer + viewerLink;

  const preset = vtkColorMaps.getPresetByName('erdc_rainbow_bright');

  let backgroundLight = hexRgb(lightTheme.body, {format: 'array'});
  let backgroundDark = hexRgb(darkTheme.body, {format: 'array'});
  backgroundLight = backgroundLight.map(x => x / 255);
  backgroundDark = backgroundDark.map(x => x / 255);
  backgroundLight.pop();
  backgroundDark.pop();

  let textColorLight = lightTheme.vtkText.color;
  let textColorDark = darkTheme.vtkText.color;
  const textColorLoader = localTheme ===
    'light' ? lightTheme.bodyText.color : darkTheme.bodyText.color;

  // TODO: improve transparent color definition
  let secondaryColor = localTheme ===
    'light' ? lightTheme.appBar.background : darkTheme.appBar.background;
  secondaryColor = hexRgb(secondaryColor, {format: 'array'});
  secondaryColor = 'rgba(' + secondaryColor[0] + "," + secondaryColor[1] + "," + secondaryColor[2] + ", 0.8)"

  let background = hexRgb(theme.body, {format: 'array'});
  background = background.map(x => x / 255);
  background.pop();

  const codeComponent = [];
  codeComponent.push(
    <div>
      <div>
        <a
          target="_blank"
          rel="noreferrer"
          href={repoROM + ROMLink}
        >
          {"CFD case"}
        </a>
      </div>
      <div>
        <a
          target="_blank"
          rel="noreferrer"
          href={repoViewer + viewerLink}
        >
          {"Viewer"}
        </a>
      </div>
    </div>
  );

  const yComponent = (angle) => {
    return Math.sin(angle*Math.PI/180);
  };

  const xComponent = (angle) => {
    return Math.cos(angle*Math.PI/180);
  };

  const downloadZip = async (filename) => {
    return new Promise(resolve => {
      JSZipUtils.getBinaryContent(filename, {
        progress: function(e) {
          setProcess(e.percent.toFixed(0));
        },
        callback: function (err, data) {
           // TODO: deal with errros
           resolve(data);
        }
      });
    })
  };

  const initialize = async() => {
    if (!context.current) {
      const Ux = initialVelocity*xComponent(initialAngle);
      const Uy = initialVelocity*yComponent(initialAngle);

      setVelocityValue([Ux, Uy]);
      setTemperatureValue(initialTemperature);
      setAngleValue(initialAngle);

      const zipContent = await downloadZip(path + ".zip");

      setDataDownloaded(true);
      setProcess(0);

      const zipFiles = await jszip.loadAsync(zipContent);
      const zipKeys = Object.keys(zipFiles.files);

      await rom.ready

      const B = await loadData(zipFiles, 'B_mat.txt');
      const K = await loadData(zipFiles, 'K_mat.txt');

      setProcess(10);

      const modes = await loadData(zipFiles, 'EigenModes_U_mat.txt');

      setProcess(20);

      const coeffL2 = await loadData(zipFiles, 'coeffL2_mat.txt');
      const mu = await loadData(zipFiles, 'par.txt');

      const nPhiU = B[1];
      const nPhiP = K[2];
      const nPhiNut = coeffL2[1];
      const nBC = 2;

      const reduced = new rom.reducedSteady(nPhiU + nPhiP, nPhiU + nPhiP);

      reduced.stabilization(stabilization);
      reduced.nPhiU(nPhiU);
      reduced.nPhiP(nPhiP);
      reduced.nPhiNut(nPhiNut);
      reduced.nBC(nBC);

      setProcess(40);

      if (stabilization === "supremizer") {
        const P = await loadData(zipFiles, 'P_mat.txt');
        reduced.addMatrices(P[0], K[0], B[0]);
      }
      else if (stabilization === "PPE") {
        const D = await loadData(zipFiles, 'D_mat.txt');
        const BC3 = await loadData(zipFiles, 'BC3_mat.txt');

        reduced.addBC3Matrix(BC3[0]);
        reduced.addMatrices(D[0], K[0], B[0]);
      }
      else {
        // TODO: check
      }
      reduced.addModes(modes[0]);

      setProcess(50);

      (async () => {
        reduced.nPhiNut(nPhiNut);

        let indexesU = []
        for (let j = 0; j < nPhiU; j ++ ) {
          indexesU.push(j);
        }

        let indexesNut = []
        for (let j = 0; j < nPhiNut; j ++ ) {
          indexesNut.push(j);
	}

        let indexesP = []
        for (let j = 0; j < nPhiP; j ++ ) {
          indexesP.push(j);
	}

        await Promise.all(indexesU.map(async (index) => {
          const C1Path = 'ct1_' + index + "_mat.txt";
          const C1 = await loadData(zipFiles, C1Path);
          reduced.addCt1Matrix(C1[0], index);
        }));

        setProcess(60);

        await Promise.all(indexesU.map(async (index) => {
          const C2Path = 'ct2_' + index + "_mat.txt";
          const C2 = await loadData(zipFiles, C2Path);
          reduced.addCt2Matrix(C2[0], index);
        }));

        setProcess(70);

        await Promise.all(indexesNut.map(async (indexNut) => {
          const weightPath = 'wRBF_' + indexNut + '_mat.txt';
          const weight = await loadData(zipFiles, weightPath);
          reduced.addWeight(weight[0], indexNut);
        }));

        setProcess(80);

        await Promise.all(indexesU.map(async (index) => {
          const CPath = 'C' + index + "_mat.txt"
          const C = await loadData(zipFiles, CPath);
          reduced.addCMatrix(C[0], index);
        }));

        if (stabilization === "PPE") {
          await Promise.all(indexesP.map(async (index) => {
            const GPath = 'G' + index + "_mat.txt"
            const G = await loadData(zipFiles, GPath);
            reduced.addGMatrix(G[0], index);
          }));
        }

        setProcess(90);

        const gridItem = zipFiles.files['internal.vtu'];
        const gridData = Buffer.from(await gridItem.async('arraybuffer'));
        await reduced.readUnstructuredGrid(gridData);

        const vtpFile = zipKeys.filter((x) => [".vtp"].some(e => x.endsWith(e)));

        if (vtpFile != null && threeDimensions) {
	  const vtpItem = zipFiles.files[vtpFile[0]];
          const vtpDataBuffer = Buffer.from(await vtpItem.async('arraybuffer'));
          setVtpData(vtpDataBuffer);
        }

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
     const {
       fullScreenRenderer,
       focalPoint,
       cameraPosition,
       renderer,
       renderWindow } = context.current;
     renderer.getActiveCamera().setProjectionMatrix(null);
     renderer.resetCamera();
     renderer.getActiveCamera().setPosition
     (
       cameraPosition[0],
       cameraPosition[1],
       cameraPosition[2]
     );
     renderer.getActiveCamera().setFocalPoint
     (
       focalPoint[0],
       focalPoint[1],
       focalPoint[2]
     );
     renderer.getActiveCamera().setViewUp(0.0, 1.0, 0.0)
     fullScreenRenderer.resize();
     if (portrait)
       renderer.getActiveCamera().zoom(initialZoomPortrait);
     else
       renderer.getActiveCamera().zoom(initialZoomLandscape);
     renderWindow.render();
    }
  }

  const setScene2D = (portrait, context, vtkContainerRef, theme) => {
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

    setProcess(0);

    actor.setMapper(mapper);

    mapper.setLookupTable(lookupTable);
    scalarBarActor.setVisibility(true);
    scalarBarActor.setDrawNanAnnotation(false);
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
      // zIndex: '-1'
    };
    const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
      containerStyle: mystyle,
      background,
      rootContainer: vtkContainerRef.current,
    });
    const renderer = fullScreenRenderer.getRenderer();
    renderer.setBackground(background);
    const renderWindow = fullScreenRenderer.getRenderWindow();
    lookupTable.setVectorModeToMagnitude();
    lookupTable.applyColorMap(preset);
    lookupTable.updateRange();

    const scalarBarActorStyle = {
      paddingBottom: 30,
      fontColor: theme.vtkText.color,
      fontStyle: 'normal',
      fontFamily: theme.vtkText.fontFamily
    };
    reduced.solveOnline(initialVelocity, 0.0);

    setProcess(10);

    const polydataString = reduced.unstructuredGridToPolyData();
    // TODO: parse directly as buffer or parse as a string...
    let buf = Buffer.from(polydataString, 'utf-8');
    reader.parseAsArrayBuffer(buf);
    let polydata = reader.getOutputData(0);

    renderer.addActor(scalarBarActor);
    renderer.addActor(actor);

    reduced.nu(temperatureToViscosity(initialTemperature)*1e-05);
    reduced.reconstruct();
    const newU = reduced.geometry();

    setProcess(25);

    let nCells = polydata.getNumberOfPoints();
    polydata.getPointData().setActiveScalars("uRec");

    const array = vtkDataArray.newInstance({
      name: 'uRec',
      size: nCells*3,
      numberOfComponents: 3,
      dataType: 'Float32Array'
    });

    for (let i = 0; i < nCells; i++) {
      let v =[newU[i], newU[i + nCells], newU[i + nCells * 2]];
      array.setTuple(i, v)
    }

    array.modified();
    polydata.getPointData().addArray(array);

    setProcess(50);

    let activeArray = polydata.getPointData().getArray("uRec");
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

    setProcess(100);

    if (portrait)
      renderer.getActiveCamera().zoom(initialZoomPortrait);
    else
      renderer.getActiveCamera().zoom(initialZoomLandscape);

    scalarBarActor.setVisibility(false);

    scalarBarActor.setAxisTextStyle(scalarBarActorStyle);
    scalarBarActor.setTickTextStyle(scalarBarActorStyle);
    scalarBarActor.modified();
    scalarBarActor.setVisibility(true);

    const camera = renderer.getActiveCamera();
    let focalPoint = [].concat(camera ? camera.getFocalPoint() : [0, 1, 2]);
    let cameraPosition = [].concat(camera ? camera.getPosition() : [0, 1, 2]);

    cameraPosition[1] += offsetY;
    focalPoint[1] += offsetY;

    renderer.getActiveCamera().setPosition
    (
      cameraPosition[0],
      cameraPosition[1],
      cameraPosition[2]
    );
    renderer.getActiveCamera().setFocalPoint
    (
      focalPoint[0],
      focalPoint[1],
      focalPoint[2]
    );
    renderWindow.modified();
    renderWindow.render();

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

  const setScene3D = (portrait, context, vtkContainerRef, theme) => {
    setProcess(0);
    const { reduced } = context.current;
    const reader = vtkXMLPolyDataReader.newInstance();
    const scalarBarActor = vtkScalarBarActor.newInstance();
    const lookupTable = vtkColorTransferFunction.newInstance();
    const mapperPlaneX = vtkMapper.newInstance({
      interpolateScalarsBeforeMapping: true,
      colorByArrayName: "uRec",
      colorMode: ColorMode.DEFAULT,
      scalarMode: 'pointData',
      useLookupTableScalarRange: true,
      lookupTable,
    });
    const mapperPlaneY = vtkMapper.newInstance({
      interpolateScalarsBeforeMapping: true,
      colorByArrayName: "uRec",
      colorMode: ColorMode.DEFAULT,
      scalarMode: 'pointData',
      useLookupTableScalarRange: true,
      lookupTable,
    });
    const mapperPlaneZ = vtkMapper.newInstance({
      interpolateScalarsBeforeMapping: true,
      colorByArrayName: "uRec",
      colorMode: ColorMode.DEFAULT,
      scalarMode: 'pointData',
      useLookupTableScalarRange: true,
      lookupTable,
    });

    mapperPlaneX.setScalarModeToUsePointFieldData();
    mapperPlaneY.setScalarModeToUsePointFieldData();
    mapperPlaneZ.setScalarModeToUsePointFieldData();

    const mapper = vtkMapper.newInstance({
      interpolateScalarsBeforeMapping: true,
      colorByArrayName: "uRec",
      colorMode: ColorMode.DEFAULT,
      scalarMode: 'pointData',
      useLookupTableScalarRange: true,
      lookupTable,
    });
    mapper.setLookupTable(lookupTable);
    mapperPlaneX.setLookupTable(lookupTable);
    mapperPlaneY.setLookupTable(lookupTable);
    mapperPlaneZ.setLookupTable(lookupTable);
    scalarBarActor.setVisibility(true);
    scalarBarActor.setDrawNanAnnotation(false);
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
      // zIndex: '-1'
    };
    const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
      containerStyle: mystyle,
      background,
      rootContainer: vtkContainerRef.current,
    });
    const renderer = fullScreenRenderer.getRenderer();
    renderer.setBackground(background);
    const renderWindow = fullScreenRenderer.getRenderWindow();
    lookupTable.setVectorModeToMagnitude();
    lookupTable.applyColorMap(preset);
    lookupTable.updateRange();

    const scalarBarActorStyle = {
      paddingBottom: 30,
      fontColor: theme.vtkText.color,
      fontStyle: 'normal',
      fontFamily: theme.vtkText.fontFamily
    };
    reduced.solveOnline(initialVelocity, 0.0);
    setProcess(10);

    reduced.nu(temperatureToViscosity(initialTemperature)*1e-05);
    reduced.reconstruct();

    setProcess(25);

    const readerOutline = vtkXMLPolyDataReader.newInstance();
    const polydataStringOutline = reduced.unstructuredGridToPolyData();
    // TODO: parse directly as buffer or parse as a string...
    const bufOutline = Buffer.from(polydataStringOutline, 'utf-8');
    readerOutline.parseAsArrayBuffer(bufOutline);
    const polydataOutline = readerOutline.getOutputData(0);
    const bounds = polydataOutline.getBounds();

    setBoundsTest(bounds);

    const outline = vtkOutlineFilter.newInstance();

    outline.setInputData(polydataOutline);

    const mapperOutline = vtkMapper.newInstance();
    mapperOutline.setInputConnection(outline.getOutputPort());
    const actorOutline = vtkActor.newInstance();
    actorOutline.setMapper(mapperOutline);
    actorOutline.getProperty().set({ lineWidth: 2 });
    actorOutline.getProperty().setColor(textColorLoader);

    const planeReader = vtkXMLPolyDataReader.newInstance();
    const actorPlaneX = vtkActor.newInstance();
    const actorPlaneY = vtkActor.newInstance();
    const actorPlaneZ = vtkActor.newInstance();

    const polydataStringX = reduced.planeX(planeXValue);
    let buf = Buffer.from(polydataStringX, 'utf-8');
    planeReader.parseAsArrayBuffer(buf);
    let planeX = planeReader.getOutputData(0);

    const polydataStringY = reduced.planeY(planeYValue);
    buf = Buffer.from(polydataStringY, 'utf-8');
    planeReader.parseAsArrayBuffer(buf);
    let planeY = planeReader.getOutputData(0);

    const polydataStringZ = reduced.planeZ(planeZValue);
    buf = Buffer.from(polydataStringZ, 'utf-8');
    planeReader.parseAsArrayBuffer(buf);
    let planeZ = planeReader.getOutputData(0);

    actorPlaneX.setMapper(mapperPlaneX);
    actorPlaneY.setMapper(mapperPlaneY);
    actorPlaneZ.setMapper(mapperPlaneZ);
    mapperPlaneX.setInputData(planeX);
    mapperPlaneY.setInputData(planeY);
    mapperPlaneZ.setInputData(planeZ);

    renderer.addActor(actorOutline);

    renderer.addActor(scalarBarActor);
    renderer.addActor(actorPlaneX);
    renderer.addActor(actorPlaneY);
    renderer.addActor(actorPlaneZ);

    const newUx = reduced.updatePlaneX();
    const newUy = reduced.updatePlaneY();
    const newUz = reduced.updatePlaneZ();

    planeX.getPointData().setActiveScalars("uRec");
    planeY.getPointData().setActiveScalars("uRec");
    planeZ.getPointData().setActiveScalars("uRec");

    const arrayX = vtkDataArray.newInstance({
      name: 'uRec',
      values: Float32Array.from(newUx),
      dataType: 'Float32Array'
    });

    const arrayY = vtkDataArray.newInstance({
      name: 'uRec',
      values: Float32Array.from(newUy),
      dataType: 'Float32Array'
    });

    const arrayZ = vtkDataArray.newInstance({
      name: 'uRec',
      values: Float32Array.from(newUz),
      dataType: 'Float32Array'
    });

    planeX.getPointData().removeArray('uRec');
    planeY.getPointData().removeArray('uRec');
    planeZ.getPointData().removeArray('uRec');

    planeX.getPointData().addArray(arrayX);
    planeY.getPointData().addArray(arrayY);
    planeZ.getPointData().addArray(arrayZ);

    planeX.getPointData().setActiveScalars("uRec");
    planeY.getPointData().setActiveScalars("uRec");
    planeZ.getPointData().setActiveScalars("uRec");

    dataRangeX = arrayX.getRange();
    dataRangeY = arrayY.getRange();
    dataRangeZ = arrayZ.getRange();

    const min = Math.min(dataRangeX[0], dataRangeY[0], dataRangeZ[0]);
    const max = Math.max(dataRangeX[1], dataRangeY[1], dataRangeZ[1]);

    mapperPlaneX.setScalarRange(min, max);
    mapperPlaneY.setScalarRange(min, max);
    mapperPlaneZ.setScalarRange(min, max);
    mapperPlaneX.setColorByArrayName('uRec');
    mapperPlaneY.setColorByArrayName('uRec');
    mapperPlaneZ.setColorByArrayName('uRec');
    mapperPlaneX.setInputData(planeX);
    mapperPlaneY.setInputData(planeY);
    mapperPlaneZ.setInputData(planeZ);
    mapperPlaneX.update();
    mapperPlaneY.update();
    mapperPlaneZ.update();

    scalarBarActor.setScalarsToColors(mapperPlaneZ.getLookupTable());
    scalarBarActor.setAxisLabel("Velocity magnitude (m/s)");
    lookupTable.setMappingRange(min, max);
    lookupTable.updateRange();
    scalarBarActor.modified();

    // vtp
    if (vtpData) {
      reader.parseAsArrayBuffer(vtpData);
      const polydataVtp = reader.getOutputData(0);
      const mapper = vtkMapper.newInstance({
        interpolateScalarsBeforeMapping: true,
        // colorByArrayName: vtpVariable,
        colorMode: ColorMode.DEFAULT,
        scalarMode: 'pointData',
        useLookupTableScalarRange: true,
        lookupTable,
      });
      const actor = vtkActor.newInstance();
      mapper.setInputData(polydataVtp);
      actor.setMapper(mapper);
      renderer.addActor(actor);
    }

    renderer.resetCamera();

    if (portrait)
      renderer.getActiveCamera().zoom(initialZoomPortrait);
    else
      renderer.getActiveCamera().zoom(initialZoomLandscape);

    scalarBarActor.setVisibility(false);

    scalarBarActor.setAxisTextStyle(scalarBarActorStyle);
    scalarBarActor.setTickTextStyle(scalarBarActorStyle);
    scalarBarActor.modified();
    scalarBarActor.setVisibility(true);

    const camera = renderer.getActiveCamera();
    let focalPoint = [].concat(camera ? camera.getFocalPoint() : [0, 1, 2]);
    let cameraPosition = [].concat(camera ? camera.getPosition() : [0, 1, 2]);

    cameraPosition[1] += offsetY;
    focalPoint[1] += offsetY;

    renderer.getActiveCamera().setPosition
    (
      cameraPosition[0],
      cameraPosition[1],
      cameraPosition[2]
    );
    renderer.getActiveCamera().setFocalPoint
    (
      focalPoint[0],
      focalPoint[1],
      focalPoint[2]
    );
    renderWindow.modified();
    renderWindow.render();

    context.current = {
      focalPoint,
      cameraPosition,
      reduced,
      reader,
      mapper,
      fullScreenRenderer,
      renderWindow,
      renderer,
      lookupTable,
      scalarBarActor,
      planeReader,
      planeX,
      planeY,
      planeZ,
      actorPlaneX,
      actorPlaneY,
      actorPlaneZ,
      mapperPlaneX,
      mapperPlaneY,
      mapperPlaneZ
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
           let a = document.createElement("a");
           a.innerHTML = 'download';
           a.href = URL.createObjectURL(blob);
           a.download = caseName + "_T_" + temperatureValue.toFixed(2) + "_Ux_" +
             velocityValue[0].toFixed(2) + "_Uy_" + velocityValue[1].toFixed(2) + ".png";
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
      let blob = new Blob([data_string], {
        type: 'text/plain'
      });
       let a = document.createElement("a");
       a.innerHTML = 'download';
       a.href = URL.createObjectURL(blob);
       a.download = caseName + "_T_" + temperatureValue.toFixed(2) + "_Ux_" +
         velocityValue[0].toFixed(2) + "_Uy_" + velocityValue[1].toFixed(2) + ".vtu";
       a.click();
    }
  }

  const calculateNewField2D = () => {
    if (context.current) {
      const {
        lookupTable,
        // mapper,
        polydata,
        reduced } = context.current;

      reduced.nu(temperatureToViscosity(temperatureValue)*1e-05);
      reduced.solveOnline(velocityValue[0], velocityValue[1]);
      reduced.reconstruct()

      polydata.getPointData().removeArray('uRec');
      const array = vtkDataArray.newInstance({
          name: 'uRec',
          values: Float32Array.from(reduced.geometry()),
          dataType: 'Float32Array'
      });
      polydata.getPointData().addArray(array);

      dataRangeX = array.getRange();

      lookupTable.setMappingRange(dataRangeX[0], dataRangeX[1]);
      lookupTable.updateRange();
    };
  };

  const calculateNewField3D = async (doReconstruct, doPlaneX, doPlaneY, doPlaneZ) => {
    if (context.current) {
      const {
        // scalarBarActor,
        lookupTable,
        // mapperPlaneX,
        // mapperPlaneY,
        // mapperPlaneZ,
        planeX,
        planeY,
        planeZ,
        reduced } = context.current;

      if (doReconstruct) {
        reduced.nu(temperatureToViscosity(temperatureValue)*1e-05);
        reduced.solveOnline(velocityValue[0], velocityValue[1]);
        reduced.reconstruct();
      }

      const updatePlaneY = () => {
        planeY.getPointData().removeArray('uRec');
        const array = vtkDataArray.newInstance({
          name: 'uRec',
          values: Float32Array.from(reduced.updatePlaneY()),
          dataType: 'Float32Array'
        });

        dataRangeY = array.getRange();
        planeY.getPointData().addArray(array);
      }

      const updatePlaneZ = () => {
        planeZ.getPointData().removeArray('uRec');
        const array = vtkDataArray.newInstance({
          name: 'uRec',
          values: Float32Array.from(reduced.updatePlaneZ()),
          dataType: 'Float32Array'
        });

        dataRangeZ = array.getRange();
        planeZ.getPointData().addArray(array);
      }

      const updatePlaneX = () => {
        planeX.getPointData().removeArray('uRec');
        const array = vtkDataArray.newInstance({
          name: 'uRec',
          values: Float32Array.from(reduced.updatePlaneX()),
          dataType: 'Float32Array'
        });

        dataRangeX = array.getRange();
        planeX.getPointData().addArray(array);
      }

      if (doPlaneY && showPlaneY) {
        updatePlaneY();
      }
      if (doPlaneZ && showPlaneZ) {
        updatePlaneZ();
      }
      if (doPlaneX && showPlaneX) {
        updatePlaneX();
      }

      lookupTable.setMappingRange(
        Math.min(dataRangeX[0], dataRangeY[0], dataRangeZ[0]),
        Math.max(dataRangeX[1], dataRangeY[1], dataRangeZ[1])
      );

      lookupTable.updateRange();
    };
  };

  const handlePlaneXChange = (event, newValue) => {
    setPlaneXValue(newValue);
  };

  const handlePlaneYChange = (event, newValue) => {
    setPlaneYValue(newValue);
  };

  const handlePlaneZChange = (event, newValue) => {
    setPlaneZValue(newValue);
  };

  // - Define new X slice
  useEffect(() => {
    if (context.current && sceneLoaded) {
      const { reduced, planeReader, planeX } = context.current;
      const polydataString = reduced.planeX(planeXValue);
      const buf = Buffer.from(polydataString, 'utf-8');

      planeReader.parseAsArrayBuffer(buf);
      planeX.shallowCopy(planeReader.getOutputData(0));
      calculateNewField3D(false, true, false, false);
    }
  }, [showPlaneX, planeXValue]);

  // - Define new Y slice
  useEffect(() => {
    if (context.current && sceneLoaded) {
      const { reduced, planeReader, planeY } = context.current;
      const polydataString = reduced.planeY(planeYValue);
      const buf = Buffer.from(polydataString, 'utf-8');

      planeReader.parseAsArrayBuffer(buf);
      planeY.shallowCopy(planeReader.getOutputData(0));
      calculateNewField3D(false, false, true, false);
    }
  }, [showPlaneY, planeYValue]);

 // - Define new Z slice
  useEffect(() => {
    if (context.current && sceneLoaded) {
      const { reduced, planeReader, planeZ } = context.current;
      const polydataString = reduced.planeZ(planeZValue);
      const buf = Buffer.from(polydataString, 'utf-8');

      planeReader.parseAsArrayBuffer(buf);
      planeZ.shallowCopy(planeReader.getOutputData(0));
      calculateNewField3D(false, false, false, true);
    }
  }, [showPlaneZ, planeZValue]);

  const update = (eventSrc, value) => {
    if (eventSrc === 'slider-angle') {
      const Ux = initialVelocity*xComponent(value);
      const Uy = initialVelocity*yComponent(value);

      setAngleValue(value);
      setVelocityValue([Ux, Uy]);
    } else if (eventSrc === 'slider-velocity') {
      setVelocityValue([value, null]);
    } else if (eventSrc === 'slider-temperature') {
      setTemperatureValue(value);
    }
    else {
      console.log("Slider not known")
    }
  };

  const toogleTooltip= () => {
    setAuthorsTooltipOpen(!authorsTooltip);
    if (!authorsTooltip)
      setCodeTooltipOpen(false);
  };

  const toogleCodeTooltip= () => {
    setCodeTooltipOpen(!codeTooltip);
    if (!codeTooltip)
      setAuthorsTooltipOpen(false);
  };

  // - Show/hide variables
  const handleSetShowU = () => {
    setShowU(!showU);
    if (!showU)
      setShowPlanes(false);
  };

  // - Show/hide planes
  const handleSetShowPlanes = () => {
    setShowPlanes(!showPlanes);
    if (!showPlanes)
      setShowU(false);
  };

  const handlePlaneX = () => {
    if (context.current) {
      const { actorPlaneX } = context.current;
      setShowPlaneX(!showPlaneX);
      actorPlaneX.setVisibility(!showPlaneX)
    }
  }

  const handlePlaneY = () => {
    if (context.current) {
      const { actorPlaneY } = context.current;
      setShowPlaneY(!showPlaneY);
      actorPlaneY.setVisibility(!showPlaneY)
    }
  }

  const handlePlaneZ = () => {
    if (context.current) {
      const { actorPlaneZ } = context.current;
      setShowPlaneZ(!showPlaneZ);
      actorPlaneZ.setVisibility(!showPlaneZ)
    }
  }

  const handleChange = (event, newValue) => {
    debounceUpdate(event.target.name, newValue);
  };

  const [debounceUpdate] = useState(() =>
    debounce(update, debounceTime, {
      leading: false,
      trailing: true
    })
  );

  useEffect(() => {
    initialize();
  }, []);


  useEffect(() => {
    const githubAPI = "https://api.github.com"
    const repoURL = "/repos/simzero-oss/rom-js/"
    const commitsEndpoint = repoURL + "commits"
    const commitsURL = githubAPI + commitsEndpoint
    fetch(commitsURL + "?path=" + ROMLink)
      .then(response => response.json())
      .then(commits => {
        const names = [];
        const authorComponent = [];
        authorComponent.push(
          <div
            style={{
              color: "#777",
              fontFamily: theme.vtkText.fontFamily,
              //textDecoration: 'underline',
              paddingiBottom: 4
	    }}
          >
            Contributors:
          </div>
        );
        for (let i = 0; i < commits.length; i++) {
          if (!names.includes(commits[i].commit.author.name)) {
            const name = commits[i].commit.author.name;
            names.push(name);
            const author = "@" + name;
            authorComponent.push(
              <a
                target="_blank"
                rel="noreferrer"
                href={"https://github.com/" + name}
              >
                {author}
              </a>
            );
          }
        }
        setAuthors(authorComponent)
        // console.log(names.join("\n"));
      })
  }, []);

  useEffect(() => {
    if (context.current && isMobile)
     resetCamera();
  }, [orientation]);

  useEffect(() => {
    if (context.current && !sceneLoaded) {
      const localTheme = window.localStorage.getItem('theme') || "light"
      const initialTheme = localTheme === 'light' ? lightTheme : darkTheme;

      if (threeDimensions) {
        setScene3D(initialPortrait, context, vtkContainerRef, initialTheme);
      }
      else {
        setScene2D(initialPortrait, context, vtkContainerRef, initialTheme);
      }
      setSceneLoaded(true);
    }
  }, [dataLoaded, initialPortrait]);

  useEffect(() => {
    if (context.current && ready) {
      (async () => {
        const { reduced } = context.current;
        setDataLoaded(true);
        window.scrollTo(0, 0);
      })();
    }
  }, [ready]);

  useEffect(() => {
    if (context.current) {
      if (threeDimensions) {
        calculateNewField3D(true, true, true, true);
      }
      else {
        calculateNewField2D();
      }
    }
  }, [temperatureValue, velocityValue]);

  useEffect(() => {
    if (context.current) {
      const { mapper, renderer, renderWindow, scalarBarActor } = context.current;
      if (renderWindow) {
        const background = localTheme === 'light'
          ? backgroundLight : backgroundDark;
        const textColor = localTheme === 'light'
          ? textColorLight : textColorDark;

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
  },
  [
    trackTheme,
    localTheme,
    textColorLight,
    textColorDark,
    backgroundLight,
    backgroundDark,
    theme.vtkText.fontFamily
  ]);

  useEffect(() => {
    return () => {
      if (context.current) {
        const {
          actor,
          reader,
          reduced,
          renderer,
          renderWindow,
          fullScreenRenderer,
          lookupTable,
          polydata,
          scalarBarActor,
          mapper } = context.current;
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

// TODO: rewrite styles to classes
  return (
    <div ref={vtkContainerRef}>
      {(!dataLoaded && !dataDownloaded) &&
        <div
            style={{
              position: 'absolute', left: '50%', top: '35%',
              transform: 'translate(-50%, -35%)',
              width: '100%'
            }}
            className={classes.bodyText}
          >
            <div
              style={{
                textAlign: 'center',
                paddingBottom: 20
              }}
            >
              Downloading data ({process} %)
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
      {(!dataLoaded && dataDownloaded) &&
          <div
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
              Setting up the model ({process} %)
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
      {(dataLoaded && dataDownloaded && !sceneLoaded) &&
          <div
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
              Setting up the scene ({process} %)
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
      {(!sceneLoaded && isMobile) &&
        <div
          style={{
            position: 'absolute', left: '50%', top: '75%', right: 0,
            transform: 'translate(-50%, -50%)',
            width: '100%',
            textAlign: 'center',
            alignItems: 'center',
            dispplay: 'flex',
            padding: 12
          }}
          className={classes.bodyText}
        >
          <div
            style={{
              justifyContent: 'center'
            }}
          >
            <div>
              <div>
                <IconButton
                  edge={false}
                  style={{ fontSize: '12px', color: mainSecondaryColor }}
                  aria-label="mode"
                >
                  {<AutoAwesomeIcon />}
                </IconButton>
              </div>
              <Fader text={messages}>
              </Fader>
            </div>
          </div>
        </div>
      }
      {(!sceneLoaded && !isMobile) &&
        <div
          style={{
            position: 'absolute', left: '50%', top: '75%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            justifyContent: 'center',
            textAlign: 'center',
            alignItems: 'center',
            display: 'flex',
          }}
          className={classes.bodyText}
        >
          <div style={{fontStyle: 'italic'}}>
            <div>
              <IconButton
                edge={false}
                style={{
                  paddingLeft: 0,
                  paddingRight: 8,
                  color: mainSecondaryColor
                }}
                aria-label="mode"
              >
                {<AutoAwesomeIcon />}
              </IconButton>
            </div>
            <div>Rotate: left mouse</div>
            <div>Pan: left mouse + shift</div>
            <div>Spin: left mouse + ctrl/alt</div>
            <div>Zoom: mouse wheel</div>
          </div>
        </div>
      }
      {(sceneLoaded) &&
        <div>
          <div
            style={{
              paddingBottom: 80,
              position: 'absolute',
              bottom: '65px',
              left: '10px',
              backgroundColor: background,
              padding: '5px',
              marginRight: '2%'
            }}
          >
            <Tooltip
              id="tooltip"
              enterDelay={1000}
              leaveDelay={200}
              arrow
              open={codeTooltip}
              disableFocusListener
              disableHoverListener
              disableTouchListener
              placement="right-start"
              title={codeComponent}
              classes={{
                popper: classes.tooltip
              }}
            >
              <IconButton
                id="code"
                edge={false}
                style={{
                  border: "5px",
                  outline: "5px",
                  color: mainSecondaryColor
                }}
                aria-label="mode"
                onClick={toogleCodeTooltip}
              >
                {<CodeIcon />}
              </IconButton>
            </Tooltip>
          </div>
          <div
            style={{
              paddingBottom: 80,
              position: 'absolute',
              bottom: '110px',
              left: '10px',
              backgroundColor: background,
              padding: '5px',
              marginRight: '2%'
            }}
          >
            <Tooltip
              id="tooltip"
              enterDelay={1000}
              leaveDelay={200}
              arrow
              open={authorsTooltip}
              disableFocusListener
              disableHoverListener
              disableTouchListener
              placement="right-start"
              title={authors}
              classes={{
                popper: classes.tooltip
              }}
            >
              <IconButton
                id="authors"
                edge={false}
                style={{
                  border: "5px",
                  outline: "5px",
                  color: mainSecondaryColor
                }}
                aria-label="mode"
                onClick={toogleTooltip}
              >
                {<GroupsIcon />}
              </IconButton>
            </Tooltip>
          </div>
          <div
            style={{
              cursor: 'pointer',
              paddingBottom: 80,
              position: 'absolute',
              top: '60px',
              right: (isMobile && landscape) ? '40px' : '20px',
              backgroundColor: background,
              padding: '5px',
              marginRight: '2%',
              border: '1px solid rgba(125, 125, 125)',
            }}
          >
            <Box
              className={classes.link}
              sx={{ height: '34px', width: '34px' }}
              onClick={downloadData}
            >
              <Tooltip title="Download data" enterDelay={1000} leaveDelay={200} arrow>
              <FontAwesomeIcon
                style={{width: '32px', height: '32px'}}
                icon={solid('download')}
              />
              </Tooltip>
            </Box>
          </div>
          <div
            style={{
              cursor: 'pointer',
              paddingBottom: 60,
              position: 'absolute',
              top: '60px',
              right: (isMobile && landscape) ? '90px' : '70px',
              backgroundColor: background,
              padding: '5px',
              marginRight: '2%',
              border: '1px solid rgba(125, 125, 125)',
            }}
          >
            <Tooltip title="Take a screenshot" enterDelay={1000} leaveDelay={200} arrow>
              <Box
                className={classes.link}
                sx={{ height: '34px', width: '34px' }}
                onClick={takeScreenshot}
              >
                <FontAwesomeIcon
                  style={{width: '32px', height: '32px'}}
                  icon={solid('camera-retro')}
                />
              </Box>
            </Tooltip>
          </div>
          <div
            style={{
              cursor: 'pointer',
              paddingBottom: 60,
              position: 'absolute',
              top: '60px',
              right: (isMobile && landscape) ? '140px' : '120px',
              backgroundColor: background,
              padding: '5px',
              marginRight: '2%',
              border: '1px solid rgba(125, 125, 125)',
            }}
          >
            <Tooltip title="Reset camera" enterDelay={1000} leaveDelay={200} arrow>
            <Box
              className={classes.link}
              sx={{ height: '34px', width: '34px' }}
              onClick={resetCamera}
            >
              <FontAwesomeIcon
                style={{width: '32px', height: '32px', cursor: 'pointer'}}
                icon={solid('undo-alt')}
              />
            </Box>
            </Tooltip>
          </div>
          <div
            onClick={handleSetShowU}
            style={{
              cursor: 'pointer',
              paddingBottom: 60,
              position: 'absolute',
              top: '60px',
              right: (isMobile && landscape) ? '190px' : '170px',
              backgroundColor: background,
              padding: '5px',
              marginRight: '2%',
              border: '1px solid rgba(125, 125, 125)',
            }}
            className={showU ? classes.viewButtonsPressed : null}
          >
            <Tooltip title="Show variables" enterDelay={1000} leaveDelay={200} arrow>
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
            </Tooltip>
          </div>
          {(threeDimensions) &&
              <div
                style={{
                  cursor: 'pointer',
                  paddingBottom: 60,
                  position: 'absolute',
                  top: '60px',
                  right: (isMobile && landscape) ? '240px' : '220px',
                  backgroundColor: background,
                  padding: '5px',
                  marginRight: '2%',
                  border: '1px solid rgba(125, 125, 125)',
                }}
                className={showPlanes ? classes.viewButtonsPressed : null}
              >
                <Tooltip title="Show planes" enterDelay={1000} leaveDelay={200} arrow>
                  <Box
                    className={classes.link}
                    sx={{ height: '34px', width: '34px' }}
                    onClick={handleSetShowPlanes}
                  >
                    <LayersIcon
                      style={{width: '32px', height: '32px'}}
                    />
                  </Box>
                </Tooltip>
              </div>
          }
        </div>
        }
      {(sceneLoaded && !showPlanes && showU) &&
      <div
        style={{
          width: 250,
          display: "inline-block",
          verticalAlign: "middle",
          alignItems: "center",
          paddingTop: 0,
          paddingBottom: 0,
          padding: 0,
          position: 'absolute',
          top: portrait ? '120px' : '60px',
          left: portrait ? '' : '20px',
          right: portrait ? '25px' : '',
          backgroundColor: secondaryColor,
          border: '1px solid rgba(125, 125, 125)',
        }}
      >
        <div>
          {(dynamicTemperature) &&
            <div style={{alignItems: "center", verticalAlign: "middle", padding: 0}}>
              <div style={{paddingLeft: 6, display: "flex", flexFlow: "row", paddingTop: 2}} className={classes.vtkText}>
                Temperature (°C)
              </div>
              <div style={{display: "flex", flexFlow: "row", padding: 0}}>
                <div style={{display: "flex", alignItems: "center", verticalAlign: "middle", padding: 0}}>
                  <Box
                    sx={{ paddingBottom: 0, paddingLeft: 1, paddingTop: 0, paddingRight: 3, width: 200 }}
                    style={{display: "flex", alignItems: "center", verticalAlign: "middle"}}
                  >
                    <Slider
                      className={classes.slider}
                      name={"slider-temperature"}
                      defaultValue={temperatureValue}
                      onChange={handleChange}
                      step={stepTemperature}
                      min={minTemperature}
                      max={maxTemperature}
                      valueLabelDisplay="off"
                    />
                  </Box>
                </div>
                <div
                  style={{paddingTop: 0, paddingBottom: 0, paddingRight: 1, display: "flex", alignItems: "center", verticalAlign: "middle"}}
                  className={classes.vtkText}>
                  {temperatureValue}
                </div>
              </div>
            </div>
          }
          {(dynamicVelocity) &&
            <div style={{alignItems: "center", verticalAlign: "middle", padding: 0}}>
              <div style={{paddingLeft: 6, display: "flex", flexFlow: "row", paddingTop: 2}} className={classes.vtkText}>
                Inlet velocity (m/s)
              </div>
              <div style={{display: "flex", flexFlow: "row", padding: 0}}>
                <div style={{display: "flex", alignItems: "center", verticalAlign: "middle", padding: 0}}>
                  <Box
                    sx={{ paddingBottom: 0, paddingLeft: 1, paddingTop: 0, paddingRight: 3, width: 200 }}
                    style={{display: "flex", alignItems: "center", verticalAlign: "middle"}}
                  >
                    <Slider
                      className={classes.slider}
                      name={"slider-velocity"}
                      defaultValue={velocityValue[0]}
                      onChange={handleChange}
                      step={stepVelocity}
                      min={minVelocity}
                      max={maxVelocity}
                      valueLabelDisplay="off"
                    />
                  </Box>
                </div>
                <div
                  style={{paddingTop: 0, paddingBottom: 0, paddingRight: 1, display: "flex", alignItems: "center", verticalAlign: "middle"}}
                  className={classes.vtkText}
                >
                  {velocityValue[0]}
                </div>
              </div>
            </div>
          }
          {(dynamicAngle) &&
            <div style={{alignItems: "center", verticalAlign: "middle", padding: 0}}>
              <div style={{paddingLeft: 6, display: "flex", flexFlow: "row", paddingTop: 2}} className={classes.vtkText}>
                Inlet velocity angle (°)
              </div>
              <div style={{display: "flex", flexFlow: "row", padding: 0}}>
                <div style={{display: "flex", alignItems: "center", verticalAlign: "middle", padding: 0}}>
                  <Box
                    sx={{ paddingBottom: 0, paddingLeft: 1, paddingTop: 0, paddingRight: 3, width: 200 }}
                    style={{display: "flex", alignItems: "center", verticalAlign: "middle"}}
                  >
                    <Slider
                      className={classes.slider}
                      name={"slider-angle"}
                      defaultValue={angleValue}
                      onChange={handleChange}
                      step={stepAngle}
                      min={minAngle}
                      max={maxAngle}
                      valueLabelDisplay="off"
                    />
                  </Box>
                </div>
                <div
                  style={{paddingTop: 0, paddingBottom: 0, paddingRight: 1, display: "flex", alignItems: "center", verticalAlign: "middle"}}
                  className={classes.vtkText}
                >
                  {angleValue}
                </div>
              </div>
            </div>
          }
        </div>
      </div>
      }
      {(sceneLoaded && showPlanes) &&
        <div
          style={{
            width: 250,
            display: "inline-block",
            verticalAlign: "middle",
            alignItems: "center",
            paddingTop: 0,
            paddingBottom: 0,
            padding: 0,
            position: 'absolute',
            top: portrait ? '120px' : '60px',
            left: portrait ? '' : '20px',
            right: portrait ? '25px' : '',
            backgroundColor: secondaryColor,
            border: '1px solid rgba(125, 125, 125)',
          }}
        >
          <div style={{alignItems: "center", verticalAlign: "middle", padding: 0}}>
            <div style={{paddingLeft: 6, display: "flex", flexFlow: "row", paddingTop: 2}} className={classes.vtkText}>
              <span
                style={{
                  paddingRight: 5
                }}
                className={classes.link}
                sx={{
                  height: '200px',
                  width: '200px'
                }}
                onClick={handlePlaneX}
              >
                {showPlaneX
                  ? <VisibilityIcon style={{width: '20px', height: '20px'}}/>
                  : <VisibilityOffIcon style={{width: '20px', height: '20px'}}/>
                }
              </span>
              <span className={classes.vtkText}>
                Plane X (m)
              </span>
            </div>
            <div style={{display: "flex", flexFlow: "row", padding: 0}}>
              <div style={{display: "flex", alignItems: "center", verticalAlign: "middle", padding: 0}}>
                <Box
                  sx={{ paddingBottom: 0, paddingLeft: 1, paddingTop: 0, paddingRight: 3, width: 200 }}
                  style={{display: "flex", alignItems: "center", verticalAlign: "middle"}}
                >
                  <Slider
                    className={classes.slider}
                    name={"slider-planeX"}
                    defaultValue={planeXValue}
                    onChange={handlePlaneXChange}
                    step={stepX}
                    min={boundsTest[0]}
                    max={boundsTest[1]}
                    valueLabelDisplay="off"
                  />
                </Box>
              </div>
              <div
                style={{paddingTop: 0, paddingBottom: 0, paddingRight: 1, display: "flex", alignItems: "center", verticalAlign: "middle"}}
                className={classes.vtkText}
              >
                {planeXValue}
              </div>
            </div>
          </div>
          <div style={{alignItems: "center", verticalAlign: "middle", padding: 0}}>
            <div style={{paddingLeft: 6, display: "flex", flexFlow: "row", paddingTop: 2}} className={classes.vtkText}>
              <span
                style={{
                  paddingRight: 5
                }}
                className={classes.link}
                sx={{
                  height: '200px',
                  width: '200px'
                }}
                onClick={handlePlaneY}
              >
                {showPlaneY
                  ? <VisibilityIcon style={{width: '20px', height: '20px'}}/>
                  : <VisibilityOffIcon style={{width: '20px', height: '20px'}}/>
                }
              </span>
              <span className={classes.vtkText}>
                Plane Y (m)
              </span>
            </div>
            <div style={{display: "flex", flexFlow: "row", padding: 0}}>
              <div style={{display: "flex", alignItems: "center", verticalAlign: "middle", padding: 0}}>
                <Box
                  sx={{ paddingBottom: 0, paddingLeft: 1, paddingTop: 0, paddingRight: 3, width: 200 }}
                  style={{display: "flex", alignItems: "center", verticalAlign: "middle"}}
                >
                  <Slider
                    className={classes.slider}
                    name={"slider-planeY"}
                    defaultValue={planeYValue}
                    onChange={handlePlaneYChange}
                    step={stepY}
                    min={boundsTest[2]}
                    max={boundsTest[3]}
                    valueLabelDisplay="off"
                  />
                </Box>
              </div>
              <div
                style={{paddingTop: 0, paddingBottom: 0, paddingRight: 1, display: "flex", alignItems: "center", verticalAlign: "middle"}}
                className={classes.vtkText}
              >
                {planeYValue}
              </div>
            </div>
          </div>
          <div style={{alignItems: "center", verticalAlign: "middle", padding: 0}}>
            <div style={{paddingLeft: 6, display: "flex", flexFlow: "row", paddingTop: 2}} className={classes.vtkText}>
              <span
                style={{
                  paddingRight: 5
                }}
                className={classes.link}
                sx={{
                  height: '200px',
                  width: '200px'
                }}
                onClick={handlePlaneZ}
              >
                {showPlaneZ
                  ? <VisibilityIcon style={{width: '20px', height: '20px'}}/>
                  : <VisibilityOffIcon style={{width: '20px', height: '20px'}}/>
                }
              </span>
              <span className={classes.vtkText}>
                Plane Z (m)
              </span>
            </div>
            <div style={{display: "flex", flexFlow: "row", padding: 0}}>
              <div style={{display: "flex", alignItems: "center", verticalAlign: "middle", padding: 0}}>
                <Box
                  sx={{ paddingBottom: 0, paddingLeft: 1, paddingTop: 0, paddingRight: 3, width: 200 }}
                  style={{display: "flex", alignItems: "center", verticalAlign: "middle"}}
                >
                  <Slider
                    className={classes.slider}
                    name={"slider-planeZ"}
                    defaultValue={planeZValue}
                    onChange={handlePlaneZChange}
                    step={stepZ}
                    min={boundsTest[4]}
                    max={boundsTest[5]}
                    valueLabelDisplay="off"
                  />
                </Box>
              </div>
              <div
                style={{paddingTop: 0, paddingBottom: 0, paddingRight: 1, display: "flex", alignItems: "center", verticalAlign: "middle"}}
                className={classes.vtkText}
              >
                {planeZValue}
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  )

}

export default ROMView;
