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

import debounce from 'lodash/debounce';
import { lightTheme, darkTheme } from './../theme';
import Fader from '../Main/Fader';
import hexRgb from 'hex-rgb';
import rom from '@simzero/rom'
import JSZipUtils from 'jszip-utils'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro'
import AirIcon from '@mui/icons-material/Air';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LayersIcon from '@mui/icons-material/Layers';
import CodeIcon from '@mui/icons-material/Code';
import GroupsIcon from '@mui/icons-material/Groups';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import useWindowOrientation from 'use-window-orientation';
import {isMobile} from 'react-device-detect';
import PropagateLoader from 'react-spinners/PropagateLoader';

const { ColorMode } = vtkMapper;

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

const ROMView = ({
    caseName,
    path,
    threeDimensions=false,
    initialStreamsCoords=[0, 0, 0],
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

  const createWorker = () => new Worker(
    new URL('./../Main/worker.js', import.meta.url),
    { type: 'module'},
  );

  const worker = useRef();
  const reduced = useRef();

  const { orientation, portrait, landscape } = useWindowOrientation();
  const initialPortrait = portrait;
  const vtkContainerRef = useRef(null);
  const context = useRef(null);
  const [authorsTooltip, setAuthorsTooltipOpen] = useState(false);
  const [codeTooltip, setCodeTooltipOpen] = useState(false);
  const [authors, setAuthors] = useState('');
  const [temperatureValue, setTemperatureValue] = useState(null);
  const [zipFiles,setZipFiles] = useState(null);
  const [ready, setIsReady] = useState(false);
  const [ROMReady, setIsROMReady] = useState(false);
  const [velocityValue, setVelocityValue] = useState([null, null]);
  const [angleValue, setAngleValue] = useState(initialAngle);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [dataDownloaded, setDataDownloaded] = useState(false);
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [process, setProcess] = useState(10);
  const [propagationValue, setPropagationValue] = useState(0);
  const [radiusValue, setRadiusValue] = useState(0);
  const [streamsXValue, setStreamsXValue] = useState(initialStreamsCoords[0]);
  const [streamsYValue, setStreamsYValue] = useState(initialStreamsCoords[1]);
  const [streamsZValue, setStreamsZValue] = useState(initialStreamsCoords[2]);
  const [planeXValue, setPlaneXValue] = useState(initialPlanesCoords[0]);
  const [planeYValue, setPlaneYValue] = useState(initialPlanesCoords[1]);
  const [planeZValue, setPlaneZValue] = useState(initialPlanesCoords[2]);
  const [bounds, setBounds] = useState([0, 0, 0, 0, 0, 0]);
  const [workerDone, setWorkerDone] = useState(false);
  const [sceneMode, setSceneMode] = useState('planes')
  const [showU, setShowU] = useState(true);
  const [showBoxPlanes, setShowBoxPlanes] = useState(false);
  const [showBoxStreams, setShowBoxStreams] = useState(false);
  const [showPlaneX, setShowPlaneX] = useState(true);
  const [showPlaneY, setShowPlaneY] = useState(true);
  const [showPlaneZ, setShowPlaneZ] = useState(true);
  const [showStreams, setShowStreams] = useState(true);
  const [streamsInitialized, setStreamsInitialized] = useState(false);
  const [vtpData, setVtpData] = useState(null);

  const debounceTimeVariables = (threeDimensions || isMobile) ? 500 : 1;
  const debounceTimePlanes = isMobile ? 250 : 1;
  const debounceTimeStreams = isMobile ? 500 : 500;

  const localTheme = window.localStorage.getItem('theme') || 'light';
  const theme = localTheme === 'light' ? lightTheme : darkTheme;
  const mainSecondaryColor = theme.palette.primary2Color;
  const useStyles = makeStyles(theme);
  const classes = useStyles();

  const preset = vtkColorMaps.getPresetByName('erdc_rainbow_bright');

  let backgroundLight = hexRgb(lightTheme.body, {format: 'array'});
  let backgroundDark = hexRgb(darkTheme.body, {format: 'array'});
  backgroundLight = backgroundLight.map(x => x / 255);
  backgroundDark = backgroundDark.map(x => x / 255);
  backgroundLight.pop();
  backgroundDark.pop();

  let textColorLight = lightTheme.vtkText.color;
  let textColorDark = darkTheme.vtkText.color;
  let textColorLoader = localTheme ===
    'light' ? lightTheme.bodyText.color : darkTheme.bodyText.color;

  // TODO: improve transparent color definition
  let secondaryColor = localTheme ===
    'light' ? lightTheme.appBar.background : darkTheme.appBar.background;
  secondaryColor = hexRgb(secondaryColor, {format: 'array'});
  secondaryColor = 'rgba(' + secondaryColor[0] + ',' + secondaryColor[1] +
                   ',' + secondaryColor[2] + ', 0.8)';

  let background = hexRgb(theme.body, {format: 'array'});
  background = background.map(x => x / 255);
  background.pop();

  const initializeROM = async() => {
    await rom.ready

    setIsROMReady(true);
  }

  const codeComponent = [];
  codeComponent.push(
    <div>
      <div>
        <a
          target='_blank'
          rel='noreferrer'
          href={repoROM + ROMLink}
        >
          {'CFD case'}
        </a>
      </div>
      <div>
        <a
          target='_blank'
          rel='noreferrer'
          href={repoViewer + viewerLink}
        >
          {'Viewer'}
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

  const downloadZipFiles = async (path) => {
    setZipFiles(await downloadZip(path + '.zip'));
    setDataDownloaded(true);
  };

  const resetCamera = () => {
    if (context.current) {
      let {
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
    let reader = vtkXMLPolyDataReader.newInstance();
    let actor = vtkActor.newInstance();
    let scalarBarActor = vtkScalarBarActor.newInstance();
    let lookupTable = vtkColorTransferFunction.newInstance();
    let mapper = vtkMapper.newInstance({
      interpolateScalarsBeforeMapping: true,
      colorByArrayName: 'uRec',
      colorMode: ColorMode.DEFAULT,
      scalarMode: 'pointData',
      useLookupTableScalarRange: true,
      lookupTable,
    });

    setProcess(20);

    actor.setMapper(mapper);

    mapper.setLookupTable(lookupTable);
    scalarBarActor.setVisibility(true);
    scalarBarActor.setDrawNanAnnotation(false);
    let mystyle = {
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
    let fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
      containerStyle: mystyle,
      background,
      rootContainer: vtkContainerRef.current,
    });
    let renderer = fullScreenRenderer.getRenderer();
    renderer.setBackground(background);
    let renderWindow = fullScreenRenderer.getRenderWindow();
    lookupTable.setVectorModeToMagnitude();
    lookupTable.applyColorMap(preset);
    lookupTable.updateRange();

    let scalarBarActorStyle = {
      paddingBottom: 30,
      fontColor: theme.vtkText.color,
      fontStyle: 'normal',
      fontFamily: theme.vtkText.fontFamily
    };

    setProcess(40);

    renderer.addActor(scalarBarActor);
    renderer.addActor(actor);

    scalarBarActor.setVisibility(false);

    scalarBarActor.setAxisTextStyle(scalarBarActorStyle);
    scalarBarActor.setTickTextStyle(scalarBarActorStyle);
    scalarBarActor.modified();
    scalarBarActor.setVisibility(true);

    setProcess(60);

    let camera = renderer.getActiveCamera();

    let polydataString = reduced.current.unstructuredGridToPolyData();
    let buf = Buffer.from(polydataString, 'utf-8');
    reader.parseAsArrayBuffer(buf);
    let polydata = reader.getOutputData(0);
    polydata.getPointData().setActiveScalars('uRec');

    mapper.setScalarModeToUsePointFieldData();
    mapper.setScalarRange(0,1);
    mapper.setColorByArrayName('uRec');
    mapper.setInputData(polydata);

    lookupTable.setMappingRange(0, 1);
    lookupTable.updateRange();
    scalarBarActor.setScalarsToColors(mapper.getLookupTable());
    scalarBarActor.setAxisLabel('Velocity magnitude (m/s)');
    lookupTable.updateRange();
    scalarBarActor.modified();
    renderer.resetCamera();
    
    setProcess(80);

    if (portrait)
      renderer.getActiveCamera().zoom(initialZoomPortrait);
    else
      renderer.getActiveCamera().zoom(initialZoomLandscape);

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

    setProcess(100);

    setVelocityValue([initialVelocity, 0.0]);
    setTemperatureValue(initialTemperature);
    setSceneLoaded(true);
  }

  const setScene3D = (portrait, context, vtkContainerRef, theme) => {
    setProcess(0);
    let reader = vtkXMLPolyDataReader.newInstance();
    let scalarBarActor = vtkScalarBarActor.newInstance();
    let lookupTable = vtkColorTransferFunction.newInstance();
    let planeReader = vtkXMLPolyDataReader.newInstance();
    let actorPlaneX = vtkActor.newInstance();
    let actorPlaneY = vtkActor.newInstance();
    let actorPlaneZ = vtkActor.newInstance();
    let actorStreams = vtkActor.newInstance();
    let mapperPlaneX = vtkMapper.newInstance({
      interpolateScalarsBeforeMapping: true,
      colorByArrayName: 'uRec',
      colorMode: ColorMode.DEFAULT,
      scalarMode: 'pointData',
      useLookupTableScalarRange: true,
      lookupTable,
    });
    let mapperPlaneY = vtkMapper.newInstance({
      interpolateScalarsBeforeMapping: true,
      colorByArrayName: 'uRec',
      colorMode: ColorMode.DEFAULT,
      scalarMode: 'pointData',
      useLookupTableScalarRange: true,
      lookupTable,
    });
    let mapperPlaneZ = vtkMapper.newInstance({
      interpolateScalarsBeforeMapping: true,
      colorByArrayName: 'uRec',
      colorMode: ColorMode.DEFAULT,
      scalarMode: 'pointData',
      useLookupTableScalarRange: true,
      lookupTable,
    });
    let mapperStreams = vtkMapper.newInstance({
      interpolateScalarsBeforeMapping: true,
      colorByArrayName: 'uRec',
      colorMode: ColorMode.DEFAULT,
      scalarMode: 'pointData',
      useLookupTableScalarRange: true,
      lookupTable,
    });

    mapperPlaneX.setScalarModeToUsePointFieldData();
    mapperPlaneY.setScalarModeToUsePointFieldData();
    mapperPlaneZ.setScalarModeToUsePointFieldData();
    mapperStreams.setScalarModeToUsePointFieldData();

    let mapper = vtkMapper.newInstance({
      interpolateScalarsBeforeMapping: true,
      colorByArrayName: 'uRec',
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
    let mystyle = {
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
    let fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
      containerStyle: mystyle,
      background,
      rootContainer: vtkContainerRef.current,
    });
    let renderer = fullScreenRenderer.getRenderer();
    renderer.setBackground(background);
    let renderWindow = fullScreenRenderer.getRenderWindow();
    lookupTable.setVectorModeToMagnitude();
    lookupTable.applyColorMap(preset);
    lookupTable.updateRange();

    let scalarBarActorStyle = {
      paddingBottom: 30,
      fontColor: theme.vtkText.color,
      fontStyle: 'normal',
      fontFamily: theme.vtkText.fontFamily
    };

    reduced.current.solveOnline(initialVelocity, 0.0);

    setProcess(10);

    reduced.current.nu(temperatureToViscosity(initialTemperature)*1e-05);
    reduced.current.reconstruct();

    setProcess(25);

    let readerOutline = vtkXMLPolyDataReader.newInstance();
    let polydataStringOutline = reduced.current.unstructuredGridToPolyData();
    readerOutline.parseAsArrayBuffer(Buffer.from(polydataStringOutline, 'utf-8'));
    polydataStringOutline = [];
    let polydataOutline = readerOutline.getOutputData(0);
    let polydataBounds = polydataOutline.getBounds();
    polydataBounds = polydataBounds.map(bound => Math.round(bound * 1e2)/1e2);
    setBounds(polydataBounds);

    let minBound = Math.min(polydataBounds[0], polydataBounds[2], polydataBounds[4]);
    let maxBound = Math.min(polydataBounds[1], polydataBounds[3], polydataBounds[5]);
    let sphereRadius = 0.025*(maxBound - minBound);
    setRadiusValue(sphereRadius);
    setPropagationValue(maxBound);

    let outline = vtkOutlineFilter.newInstance();
    outline.setInputData(polydataOutline);
    let mapperOutline = vtkMapper.newInstance();
    mapperOutline.setInputConnection(outline.getOutputPort());
    let actorOutline = vtkActor.newInstance();
    actorOutline.setMapper(mapperOutline);
    actorOutline.getProperty().set({ lineWidth: 2 });
    actorOutline.getProperty().setColor(textColorLoader);

    let polydataStreams = reduced.current.streams(
      streamsXValue,
      streamsYValue,
      streamsZValue,
      sphereRadius,
      100.0
    );
    let buf = Buffer.from(polydataStreams, 'utf-8');
    planeReader.parseAsArrayBuffer(buf);
    let streams = planeReader.getOutputData(0);

    let polydataStringX = reduced.current.planeX(planeXValue);
    buf = Buffer.from(polydataStringX, 'utf-8');
    planeReader.parseAsArrayBuffer(buf);
    let planeX = planeReader.getOutputData(0);

    let polydataStringY = reduced.current.planeY(planeYValue);
    buf = Buffer.from(polydataStringY, 'utf-8');
    planeReader.parseAsArrayBuffer(buf);
    let planeY = planeReader.getOutputData(0);

    let polydataStringZ = reduced.current.planeZ(planeZValue);
    buf = Buffer.from(polydataStringZ, 'utf-8');
    planeReader.parseAsArrayBuffer(buf);
    let planeZ = planeReader.getOutputData(0);

    actorStreams.setMapper(mapperStreams);
    actorPlaneX.setMapper(mapperPlaneX);
    actorPlaneY.setMapper(mapperPlaneY);
    actorPlaneZ.setMapper(mapperPlaneZ);
    mapperStreams.setInputData(streams);
    mapperPlaneX.setInputData(planeX);
    mapperPlaneY.setInputData(planeY);
    mapperPlaneZ.setInputData(planeZ);

    actorStreams.setVisibility(false);
    renderer.addActor(actorStreams);
    renderer.addActor(actorOutline);
    renderer.addActor(scalarBarActor);
    renderer.addActor(actorPlaneX);
    renderer.addActor(actorPlaneY);
    renderer.addActor(actorPlaneZ);

    streams.getPointData().setActiveScalars('uRec');
    planeX.getPointData().setActiveScalars('uRec');
    planeY.getPointData().setActiveScalars('uRec');
    planeZ.getPointData().setActiveScalars('uRec');

    let arrayX = vtkDataArray.newInstance({
      name: 'uRec',
      values: Float64Array.from(reduced.current.updatePlaneX()),
      dataType: 'Float64Array'
    });

    let arrayY = vtkDataArray.newInstance({
      name: 'uRec',
      values: Float64Array.from(reduced.current.updatePlaneY()),
      dataType: 'Float64Array'
    });

    let arrayZ = vtkDataArray.newInstance({
      name: 'uRec',
      values: Float64Array.from(reduced.current.updatePlaneZ()),
      dataType: 'Float64Array'
    });

    planeX.getPointData().removeArray('uRec');
    planeY.getPointData().removeArray('uRec');
    planeZ.getPointData().removeArray('uRec');

    planeX.getPointData().addArray(arrayX);
    planeY.getPointData().addArray(arrayY);
    planeZ.getPointData().addArray(arrayZ);

    planeX.getPointData().setActiveScalars('uRec');
    planeY.getPointData().setActiveScalars('uRec');
    planeZ.getPointData().setActiveScalars('uRec');

    dataRangeX = arrayX.getRange();
    dataRangeY = arrayY.getRange();
    dataRangeZ = arrayZ.getRange();

    let min = Math.min(dataRangeX[0], dataRangeY[0], dataRangeZ[0]);
    let max = Math.max(dataRangeX[1], dataRangeY[1], dataRangeZ[1]);

    mapperPlaneX.setScalarRange(min, max);
    mapperPlaneY.setScalarRange(min, max);
    mapperPlaneZ.setScalarRange(min, max);
    mapperStreams.setScalarRange(min, max);
    mapperPlaneX.setInputData(planeX);
    mapperPlaneY.setInputData(planeY);
    mapperPlaneZ.setInputData(planeZ);
    mapperStreams.setInputData(streams);
    mapperPlaneX.update();
    mapperPlaneY.update();
    mapperPlaneZ.update();
    mapperStreams.update();

    scalarBarActor.setScalarsToColors(mapperPlaneX.getLookupTable());
    scalarBarActor.setAxisLabel('Velocity magnitude (m/s)');
    lookupTable.setMappingRange(min, max);
    lookupTable.updateRange();
    scalarBarActor.modified();

    // vtp
    if (vtpData) {
      reader.parseAsArrayBuffer(vtpData);
      let polydataVtp = reader.getOutputData(0);
      let mapper = vtkMapper.newInstance({
        interpolateScalarsBeforeMapping: true,
        // colorByArrayName: vtpVariable,
        colorMode: ColorMode.DEFAULT,
        scalarMode: 'pointData',
        useLookupTableScalarRange: true,
        lookupTable,
      });
      let actor = vtkActor.newInstance();
      mapper.setInputData(polydataVtp);
      actor.setMapper(mapper);
      renderer.addActor(actor);
      setVtpData(null);
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

    let camera = renderer.getActiveCamera();
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
      streams,
      actorPlaneX,
      actorPlaneY,
      actorPlaneZ,
      actorStreams,
      mapperPlaneX,
      mapperPlaneY,
      mapperPlaneZ,
      mapperStreams
    };

    setSceneLoaded(true);
  }

  const takeScreenshot = () => {
    if (context.current) {
     let { renderWindow } = context.current;
     renderWindow.captureImages()[0].then(
       (image) => {
         (async () => {
           let blob = await (await fetch(image)).blob();
           let a = document.createElement('a');
           a.innerHTML = 'download';
           a.href = URL.createObjectURL(blob);
           a.download = caseName + '_T_' + temperatureValue.toFixed(2) + '_Ux_' +
             velocityValue[0].toFixed(2) + '_Uy_' + velocityValue[1].toFixed(2) + '.png';
           a.click();
         })();
       }
     );
    }
  }

  const downloadData = () => {
    if (context.current) {
      let data_string = reduced.current.exportUnstructuredGrid();
      let blob = new Blob([data_string], {
        type: 'text/plain'
      });
       let a = document.createElement('a');
       a.innerHTML = 'download';
       a.href = URL.createObjectURL(blob);
       a.download = caseName + '_T_' + temperatureValue.toFixed(2) + '_Ux_' +
         velocityValue[0].toFixed(2) + '_Uy_' + velocityValue[1].toFixed(2) + '.vtu';
       a.click();
    }
  }

  const calculateNewField2D = () => {
      let {
        lookupTable,
        renderWindow,
        polydata } = context.current;

      reduced.current.nu(temperatureToViscosity(temperatureValue)*1e-05);
      reduced.current.solveOnline(velocityValue[0], velocityValue[1]);
      reduced.current.reconstruct()

      polydata.getPointData().removeArray('uRec');
      let array = vtkDataArray.newInstance({
        name: 'uRec',
        values: Float64Array.from(reduced.current.geometry()),
        dataType: 'Float64Array'
      });
      polydata.getPointData().addArray(array);

      dataRangeX = array.getRange();

      lookupTable.setMappingRange(dataRangeX[0], dataRangeX[1]);
      lookupTable.updateRange();

      renderWindow.render();
  };

  const calculateNewField3D = (doReconstruct, doPlaneX, doPlaneY, doPlaneZ, doStreams) => {
    if (context.current) {
      let {
        renderWindow,
        lookupTable,
        planeReader,
        planeX,
        planeY,
        planeZ,
        streams } = context.current;

      if (doReconstruct) {
        reduced.current.nu(temperatureToViscosity(temperatureValue)*1e-05);
        reduced.current.solveOnline(velocityValue[0], velocityValue[1]);
        reduced.current.reconstruct();
      }

      const updatePlaneY = () => {
        planeY.getPointData().removeArray('uRec');
        let array = vtkDataArray.newInstance({
          name: 'uRec',
          values: Float64Array.from(reduced.current.updatePlaneY()),
          dataType: 'Float64Array'
        });

        dataRangeY = array.getRange();
        planeY.getPointData().addArray(array);
      }

      const updatePlaneZ = () => {
        planeZ.getPointData().removeArray('uRec');
        let array = vtkDataArray.newInstance({
          name: 'uRec',
          values: Float64Array.from(reduced.current.updatePlaneZ()),
          dataType: 'Float64Array'
        });

        dataRangeZ = array.getRange();
        planeZ.getPointData().addArray(array);
      }

      const updatePlaneX = () => {
        planeX.getPointData().removeArray('uRec');
        let array = vtkDataArray.newInstance({
          name: 'uRec',
          values: Float64Array.from(reduced.current.updatePlaneX()),
          dataType: 'Float64Array'
        });

        dataRangeX = array.getRange();
        planeX.getPointData().addArray(array);
      }

      const updateStreams = () => {
        let polydataStreams = reduced.current.streams(
          streamsXValue,
          streamsYValue,
          streamsZValue,
          radiusValue,
          propagationValue
        );
        let buf = Buffer.from(polydataStreams, 'utf-8');
        planeReader.parseAsArrayBuffer(buf);
        streams.shallowCopy(planeReader.getOutputData(0));
        let activeArray = streams.getPointData().getArrays()[0];
        dataRangeX = activeArray.getRange();
      }

      if (doPlaneY) {
        updatePlaneY();
      }
      if (doPlaneZ) {
        updatePlaneZ();
      }
      if (doPlaneX) {
        updatePlaneX();
      }
      if (doStreams) {
        updateStreams();
        lookupTable.setMappingRange(dataRangeX[0], dataRangeX[1]);
      }

      if (doPlaneX || doPlaneY || doPlaneZ) {
        lookupTable.setMappingRange(
          Math.min(dataRangeX[0], dataRangeY[0], dataRangeZ[0]),
          Math.max(dataRangeX[1], dataRangeY[1], dataRangeZ[1])
        );
      }

      lookupTable.updateRange();

      renderWindow.modified();
      renderWindow.render();
    };
  };

  const updateVariables = (eventSrc, value) => {
    if (eventSrc === 'slider-angle') {
      let Ux = initialVelocity*xComponent(value);
      let Uy = initialVelocity*yComponent(value);

      setAngleValue(value);
      setVelocityValue([Ux, Uy]);
    } else if (eventSrc === 'slider-velocity') {
      setVelocityValue([value, 0.0]);
    } else if (eventSrc === 'slider-temperature') {
      setTemperatureValue(value);
    } else {
      console.log('Slider not known');
    }
  };

  const updatePlanes = (eventSrc, value) => {
    if (eventSrc === 'slider-planeX') {
      setPlaneXValue(value);
    } else if (eventSrc === 'slider-planeY') {
      setPlaneYValue(value);
    } else if (eventSrc === 'slider-planeZ') {
      setPlaneZValue(value);
    } else {
      console.log('Slider not known');
    }
  };

  const updateStreams = (eventSrc, value) => {
    if (eventSrc === 'slider-streamsX') {
      setStreamsXValue(value);
    } else if (eventSrc === 'slider-streamsY') {
      setStreamsYValue(value);
    } else if (eventSrc === 'slider-streamsZ') {
      setStreamsZValue(value);
    } else if (eventSrc === 'slider-radius') {
      setRadiusValue(value);
    } else if (eventSrc === 'slider-propagation') {
      setPropagationValue(value);
    } else {
      console.log('Slider not known');
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
    if (!showU) {
      setShowBoxStreams(false);
      setShowBoxPlanes(false);
    }
  };

  // - Show/hide lines
  const handleSetShowStreams = () => {
    if (context.current) {
      let { actorPlaneX, actorPlaneY, actorPlaneZ, actorStreams } = context.current;

      if (!streamsInitialized) {
        setShowStreams(true);
        setStreamsInitialized(true);
      }

      setShowU(showU ? null : false);
      setShowBoxStreams(!showBoxStreams);
      setShowBoxPlanes(showBoxPlanes ? null : false);

      if (!showBoxStreams) {
        setSceneMode('streams');
        actorStreams.setVisibility(showStreams);
        actorPlaneX.setVisibility(false);
        actorPlaneY.setVisibility(false);
        actorPlaneZ.setVisibility(false);
        calculateNewField3D(false, false, false, false, true);
      }
    }
  };

  // - Show/hide planes
  const handleSetShowBoxPlanes = () => {
    if (context.current) {
      let {
        actorPlaneX,
        actorPlaneY,
        actorPlaneZ,
        actorStreams,
        renderWindow } = context.current;

      setShowU(showBoxPlanes ? null : false);
      setShowBoxStreams(showBoxPlanes ? null : false);
      setShowBoxPlanes(!showBoxPlanes);

      if (!showBoxPlanes) {
        setSceneMode('planes');
        calculateNewField3D(false, true, true, true, false);
      }

      actorPlaneX.setVisibility(showPlaneX);
      actorPlaneY.setVisibility(showPlaneY);
      actorPlaneZ.setVisibility(showPlaneZ);
      actorStreams.setVisibility(false);
      renderWindow.modified();
      renderWindow.render();
    }
  };

  const handleStreams = () => {
    if (context.current) {
      let { actorStreams, renderWindow } = context.current;
      setShowStreams(!showStreams);
      actorStreams.setVisibility(!showStreams);
      // renderWindow.modified();
      renderWindow.render();
    }
  }

  const handlePlaneX = () => {
    if (context.current) {
      let { actorPlaneX } = context.current;
      setShowPlaneX(!showPlaneX);
      actorPlaneX.setVisibility(!showPlaneX)
    }
  }

  const handlePlaneY = () => {
    if (context.current) {
      let { actorPlaneY } = context.current;
      setShowPlaneY(!showPlaneY);
      actorPlaneY.setVisibility(!showPlaneY)
    }
  }

  const handlePlaneZ = () => {
    if (context.current) {
      let { actorPlaneZ } = context.current;
      setShowPlaneZ(!showPlaneZ);
      actorPlaneZ.setVisibility(!showPlaneZ)
    }
  }

  const handleChangeVariables = (event, newValue) => {
    debounceUpdateVariables(event.target.name, newValue);
  };

  const handleChangePlanes = (event, newValue) => {
    debounceUpdatePlanes(event.target.name, newValue);
  };

  const handleChangeStreams = (event, newValue) => {
    debounceUpdateStreams(event.target.name, newValue);
  };

  const [debounceUpdateVariables] = useState(() =>
    debounce(updateVariables, debounceTimeVariables, {
      leading: false,
      trailing: true
    })
  );

  const [debounceUpdatePlanes] = useState(() =>
    debounce(updatePlanes, debounceTimePlanes, {
      leading: false,
      trailing: true
    })
  );

  const [debounceUpdateStreams] = useState(() =>
    debounce(updateStreams, debounceTimeStreams, {
      leading: false,
      trailing: true
    })
  );

  useEffect(() => {
    worker.current = createWorker();
    return () => {
      worker.current.terminate();
    }
  }, [])

  // - Define new sphere position
  useEffect(() => {
    if (context.current && showStreams && sceneLoaded && streamsInitialized) {
      calculateNewField3D(false, false, false, false, true);
    }
  }, [streamsXValue, streamsYValue, streamsZValue, radiusValue, propagationValue]);

  // - Define new X slice
  useEffect(() => {
    if (context.current) {
      let { planeReader, planeX } = context.current;
      let polydataString = reduced.current.planeX(planeXValue);
      let buf = Buffer.from(polydataString, 'utf-8');

      planeReader.parseAsArrayBuffer(buf);
      planeX.shallowCopy(planeReader.getOutputData(0));
      calculateNewField3D(false, true, false, false, false);
    }
  }, [showPlaneX, planeXValue]);

  // - Define new Y slice
  useEffect(() => {
    if (context.current) {
      let { planeReader, planeY } = context.current;
      let polydataString = reduced.current.planeY(planeYValue);
      let buf = Buffer.from(polydataString, 'utf-8');

      planeReader.parseAsArrayBuffer(buf);
      planeY.shallowCopy(planeReader.getOutputData(0));
      calculateNewField3D(false, false, true, false, false);
    }
  }, [showPlaneY, planeYValue]);

 // - Define new Z slice
  useEffect(() => {
    if (context.current) {
      let { planeReader, planeZ } = context.current;
      let polydataString = reduced.current.planeZ(planeZValue);
      let buf = Buffer.from(polydataString, 'utf-8');

      planeReader.parseAsArrayBuffer(buf);
      planeZ.shallowCopy(planeReader.getOutputData(0));
      calculateNewField3D(false, false, false, true, false);
    }
  }, [showPlaneZ, planeZValue]);

  useEffect(() => {
    if (!context.current && !ROMReady) {
      initializeROM();
    }
  }, [ROMReady]);

  useEffect(() => {
    if (!context.current && !dataDownloaded) {
      downloadZipFiles(path);
      setProcess(0);
    }
  }, [dataDownloaded]);

  useEffect(() => {
    if (!context.current && ROMReady && dataDownloaded && !ready) {
      const initialize = (e) => {
        switch (e.data.event) {
          case 'process':
            setProcess(e.data.percent);
            break;
          case 'initialization':
            worker.current.removeEventListener('message', initialize);
            setIsReady(true);
            setZipFiles(null);
            break;
          case 'constructor':
            reduced.current =
              new rom.reducedSteady(
                e.data.nPhiU + e.data.nPhiP,
                e.data.nPhiU + e.data.nPhiP
              );

            reduced.current.stabilization(stabilization);
            reduced.current.nPhiU(e.data.nPhiU);
            reduced.current.nPhiP(e.data.nPhiP);
            reduced.current.nPhiNut(e.data.nPhiNut);
            reduced.current.nRuns(e.data.nRuns);
            reduced.current.nBC(2);

            break;
          case 'matrices':
            reduced.current.B().set(e.data.B);
            reduced.current.K().set(e.data.K);

            if (stabilization === 'supremizer') {
              reduced.current.P().set(e.data.P);
            }
            else if (stabilization === 'PPE') {
              reduced.current.BC3().set(e.data.BC3);
              reduced.current.D().set(e.data.D);
            }
            else {
              // TODO: check
            }
            break;
          case 'modes':
            reduced.current.modes().set(e.data.modes);
            break;
          case 'Ct1':
            reduced.current.Ct1().set(e.data.Ct1);
            reduced.current.addCt1Matrix();
            break;
          case 'Ct2':
            reduced.current.Ct2().set(e.data.Ct2);
            reduced.current.addCt2Matrix();
            break;
          case 'weights':
            reduced.current.weights().set(e.data.weights);
            reduced.current.addWeights();
            break;
          case 'C':
            reduced.current.C().set(e.data.C);
            reduced.current.addCMatrix();
            break;
          case 'G':
            reduced.current.G().set(e.data.G);
            reduced.current.addGMatrix();
            break;
          case 'RBF':
            reduced.current.mu().set(e.data.mu);
            reduced.current.coeffL2().set(e.data.coeffL2);
            reduced.current.setRBF();
            break;
          case 'grid':
            reduced.current.readUnstructuredGrid(e.data.grid);
            reduced.current.initialize();
            break;
          case 'vtp':
            setVtpData(e.data.vtp);
            break;
          default:
            console.log('Wrong worker type: ', e.data.event);
            break;
        }
      }

      if (!context.current && !ready && ROMReady) {
        worker.current.addEventListener('message', initialize, false);
      }

      if (context.current && ready) {
        worker.current.removeEventListener('message', initialize);
        worker.current.terminate();
      }
    }
  }, [ROMReady, dataDownloaded, ready, stabilization]);

  useEffect(() => {
    if (!workerDone && zipFiles) {
        worker.current.postMessage([zipFiles, stabilization, threeDimensions]);
        setWorkerDone(true);
    }
  }, [workerDone, zipFiles, stabilization]);

  useEffect(() => {
    let githubAPI = 'https://api.github.com';
    let repoURL = '/repos/simzero-oss/rom-js/';
    let commitsEndpoint = repoURL + 'commits';
    let commitsURL = githubAPI + commitsEndpoint;
    fetch(commitsURL + '?path=' + ROMLink)
      .then(response => response.json())
      .then(commits => {
        let names = [];
        let authorComponent = [];
        authorComponent.push(
          <div
            style={{
              color: '#777',
              fontFamily: theme.vtkText.fontFamily,
              paddingiBottom: 4
            }}
          >
            Contributors:
          </div>
        );
        for (let i = 0; i < commits.length; i++) {
          if (!names.includes(commits[i].commit.author.name)) {
            let name = commits[i].commit.author.name;
            names.push(name);
            let author = '@' + name;
            authorComponent.push(
              <a
                target='_blank'
                rel='noreferrer'
                href={'https://github.com/' + name}
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
    if (dataLoaded && !sceneLoaded) {
      let localTheme = window.localStorage.getItem('theme') || 'light';
      let initialTheme = localTheme === 'light' ? lightTheme : darkTheme;

      if (threeDimensions) {
        setScene3D(initialPortrait, context, vtkContainerRef, initialTheme);
      }
      else {
        setScene2D(initialPortrait, context, vtkContainerRef, initialTheme);
      }
    }
  }, [dataLoaded, initialPortrait]);

  useEffect(() => {
    if (ready) {
      (async () => {
        setDataLoaded(true);
        window.scrollTo(0, 0);
      })();
    }
  }, [ready]);

  useEffect(() => {
    if (context.current) {
      if (threeDimensions) {
        if (sceneMode === 'streams') {
          calculateNewField3D(true, false, false, false, true);
        }
        if (sceneMode === 'planes') {
          calculateNewField3D(true, true, true, true, false);
        }
      }
      else {
        calculateNewField2D();
      }
    }
  }, [temperatureValue, velocityValue]);

  useEffect(() => {
    if (context.current) {
      let { mapper, renderer, renderWindow, scalarBarActor } = context.current;
      if (renderWindow) {
        let background = localTheme === 'light'
          ? backgroundLight : backgroundDark;
        let textColor = localTheme === 'light'
          ? textColorLight : textColorDark;

        let scalarBarActorStyle1 = {
          paddingBottom: 30,
          fontColor: textColor,
          fontStyle: 'normal',
          fontFamily: theme.vtkText.fontFamily
        };

        renderer.setBackground(background);
        scalarBarActor.setAxisTextStyle(scalarBarActorStyle1);
        scalarBarActor.setTickTextStyle(scalarBarActorStyle1);
        scalarBarActor.setAxisLabel('Velocity magnitude (m/s)');
        scalarBarActor.setScalarsToColors(mapper.getLookupTable());
        scalarBarActor.modified();
        renderWindow.render();
      }
    }
  },
  [localTheme]);

  useEffect(() => {
    return () => {
      if (context.current) {
        let {
          reader,
          fullScreenRenderer,
          renderWindow,
          renderer,
          lookupTable,
          scalarBarActor,
          planeReader,
          planeX,
          planeY,
          planeZ,
          streams,
          polydata,
          actor,
          actorStreams,
          actorPlaneX,
          actorPlaneY,
          actorPlaneZ,
          mapperPlaneX,
          mapperPlaneY,
          mapperPlaneZ,
          mapperStreams,
          mapper } = context.current;

        reader.delete();
        fullScreenRenderer.delete();
        renderWindow.delete();
        renderer.delete();
        scalarBarActor.delete();
        lookupTable.delete();
        mapper.delete();

        if (threeDimensions) {
          planeReader.delete();
          actorStreams.delete();
          actorPlaneX.delete();
          actorPlaneY.delete();
          actorPlaneZ.delete();
          mapperStreams.delete();
          mapperPlaneX.delete();
          mapperPlaneY.delete();
          mapperPlaneZ.delete();
          streams.delete();
          planeX.delete();
          planeY.delete();
          planeZ.delete();
        }
        else {
          actor.delete();
          polydata.delete();
        }

        context.current = null;
      }

      worker.current.terminate();
      reduced.current.clear();
      delete reduced.current;
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
              Downloading data ({process}%)
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
              Setting up the model ({process}%)
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
              Setting up the scene ({process}%)
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
                  aria-label='mode'
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
                aria-label='mode'
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
              id='tooltip'
              enterDelay={1000}
              leaveDelay={200}
              arrow
              open={codeTooltip}
              disableFocusListener
              disableHoverListener
              disableTouchListener
              placement='right-start'
              title={codeComponent}
              classes={{
                popper: classes.tooltip
              }}
            >
              <IconButton
                id='code'
                edge={false}
                style={{
                  border: '5px',
                  outline: '5px',
                  color: mainSecondaryColor
                }}
                aria-label='mode'
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
              id='tooltip'
              enterDelay={1000}
              leaveDelay={200}
              arrow
              open={authorsTooltip}
              disableFocusListener
              disableHoverListener
              disableTouchListener
              placement='right-start'
              title={authors}
              classes={{
                popper: classes.tooltip
              }}
            >
              <IconButton
                id='authors'
                edge={false}
                style={{
                  border: '5px',
                  outline: '5px',
                  color: mainSecondaryColor
                }}
                aria-label='mode'
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
              <Tooltip title='Download data' enterDelay={1000} leaveDelay={200} arrow>
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
            <Tooltip title='Take a screenshot' enterDelay={1000} leaveDelay={200} arrow>
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
            <Tooltip title='Reset camera' enterDelay={1000} leaveDelay={200} arrow>
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
            <Tooltip title='Show variables' enterDelay={1000} leaveDelay={200} arrow>
              <Box
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '20px'
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
                className={(showBoxPlanes) ? classes.viewButtonsPressed : null}
              >
                <Tooltip title='Show planes' enterDelay={1000} leaveDelay={200} arrow>
                  <Box
                    className={classes.link}
                    sx={{ height: '34px', width: '34px' }}
                    onClick={handleSetShowBoxPlanes}
                  >
                    <LayersIcon
                      style={{width: '32px', height: '32px'}}
                    />
                  </Box>
                </Tooltip>
              </div>
          }
          {(threeDimensions) &&
              <div
                style={{
                  cursor: 'pointer',
                  paddingBottom: 60,
                  position: 'absolute',
                  top: '60px',
                  right: (isMobile && landscape) ? '290px' : '270px',
                  backgroundColor: background,
                  padding: '5px',
                  marginRight: '2%',
                  border: '1px solid rgba(125, 125, 125)',
                }}
                className={(showBoxStreams) ? classes.viewButtonsPressed : null}
              >
                <Tooltip title='Show streamlines' enterDelay={1000} leaveDelay={200} arrow>
                  <Box
                    className={classes.link}
                    sx={{ height: '34px', width: '34px' }}
                    onClick={handleSetShowStreams}
                  >
                    <AirIcon
                      style={{width: '32px', height: '32px'}}
                    />
                  </Box>
                </Tooltip>
              </div>
          }
        </div>
        }
      {(sceneLoaded && showU) &&
      <div
        style={{
          width: 250,
          display: 'inline-block',
          verticalAlign: 'middle',
          alignItems: 'center',
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
            <div
              style={{
                alignItems: 'center',
                verticalAlign: 'middle',
                padding: 0
              }}
            >
              <div
                style={{
                  paddingLeft: 6,
                  display: 'flex',
                  flexFlow: 'row',
                  paddingTop: 2
                }}
                className={classes.vtkText}
              >
                Temperature (°C)
              </div>
              <div style={{display: 'flex', flexFlow: 'row', padding: 0}}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    verticalAlign: 'middle',
                    padding: 0
                  }}
                >
                  <Box
                    sx={{
                      paddingBottom: 0,
                      paddingLeft: 1,
                      paddingTop: 0,
                      paddingRight: 3,
                      width: 200
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      verticalAlign: 'middle'
                    }}
                  >
                    <Slider
                      className={classes.slider}
                      name={'slider-temperature'}
                      defaultValue={temperatureValue}
                      onChange={handleChangeVariables}
                      step={stepTemperature}
                      min={minTemperature}
                      max={maxTemperature}
                      valueLabelDisplay='auto'
                    />
                  </Box>
                </div>
                <div
                  style={{
                    paddingTop: 0,
                    paddingBottom: 0,
                    paddingRight: 1,
                    display: 'flex',
                    alignItems: 'center',
                    verticalAlign: 'middle'
                  }}
                  className={classes.vtkText}
                >
                  {temperatureValue}
                </div>
              </div>
            </div>
          }
          {(dynamicVelocity) &&
            <div
              style={{
                alignItems: 'center',
                verticalAlign: 'middle',
                padding: 0
              }}
            >
              <div
                style={{
                  paddingLeft: 6,
                  display: 'flex',
                  flexFlow: 'row',
                  paddingTop: 2
                }}
                className={classes.vtkText}
              >
                Inlet velocity (m/s)
              </div>
              <div style={{display: 'flex', flexFlow: 'row', padding: 0}}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    verticalAlign: 'middle',
                    padding: 0
                  }}
                >
                  <Box
                    sx={{
                      paddingBottom: 0,
                      paddingLeft: 1,
                      paddingTop: 0,
                      paddingRight: 3,
                      width: 200
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      verticalAlign: 'middle'
                    }}
                  >
                    <Slider
                      className={classes.slider}
                      name={'slider-velocity'}
                      defaultValue={velocityValue[0]}
                      onChange={handleChangeVariables}
                      step={stepVelocity}
                      min={minVelocity}
                      max={maxVelocity}
                      valueLabelDisplay='auto'
                    />
                  </Box>
                </div>
                <div
                  style={{
                    paddingTop: 0,
                    paddingBottom: 0,
                    paddingRight: 1,
                    display: 'flex',
                    alignItems: 'center',
                    verticalAlign: 'middle'
                  }}
                  className={classes.vtkText}
                >
                  {velocityValue[0]}
                </div>
              </div>
            </div>
          }
          {(dynamicAngle) &&
            <div
              style={{
                alignItems: 'center',
                verticalAlign: 'middle',
                padding: 0
              }}
            >
              <div
                style={{
                  paddingLeft: 6,
                  display: "flex",
                  flexFlow: "row",
                  paddingTop: 2
                }}
                className={classes.vtkText}
              >
                Inlet velocity angle (°)
              </div>
              <div style={{display: "flex", flexFlow: "row", padding: 0}}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    verticalAlign: "middle",
                    padding: 0
                  }}
                >
                  <Box
                    sx={{
                      paddingBottom: 0,
                      paddingLeft: 1,
                      paddingTop: 0,
                      paddingRight: 3,
                      width: 200
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      verticalAlign: "middle"
                    }}
                  >
                    <Slider
                      className={classes.slider}
                      name={"slider-angle"}
                      defaultValue={angleValue}
                      onChange={handleChangeVariables}
                      step={stepAngle}
                      min={minAngle}
                      max={maxAngle}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </div>
                <div
                  style={{
                    paddingTop: 0,
                    paddingBottom: 0,
                    paddingRight: 1,
                    display: 'flex',
                    alignItems: 'center',
                    verticalAlign: 'middle'
                  }}
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
      {(sceneLoaded && showBoxPlanes) &&
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
            <div
              style={{
                paddingLeft: 6,
                display: "flex",
                flexFlow: "row",
                paddingTop: 2
              }}
              className={classes.vtkText}
            >
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  verticalAlign: "middle",
                  padding: 0
                }}
              >
                <Box
                  sx={{
                    paddingBottom: 0,
                    paddingLeft: 1,
                    paddingTop: 0,
                    paddingRight: 3,
                    width: 200
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    verticalAlign: "middle"
                  }}
                >
                  <Slider
                    className={classes.slider}
                    name={"slider-planeX"}
                    defaultValue={planeXValue}
                    onChange={handleChangePlanes}
                    step={stepPlanes}
                    min={bounds[0]}
                    max={bounds[1]}
                    valueLabelDisplay="auto"
                  />
                </Box>
              </div>
              <div
                style={{
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingRight: 1,
                  display: "flex",
                  alignItems: "center",
                  verticalAlign: "middle"
                }}
                className={classes.vtkText}
              >
                {planeXValue}
              </div>
            </div>
          </div>
          <div style={{alignItems: 'center', verticalAlign: 'middle', padding: 0}}>
            <div
              style={{
                paddingLeft: 6,
                display: 'flex',
                flexFlow: 'row',
                paddingTop: 2
              }}
              className={classes.vtkText}
            >
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
            <div style={{display: 'flex', flexFlow: 'row', padding: 0}}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  verticalAlign: 'middle',
                  padding: 0
                }}
              >
                <Box
                  sx={{
                    paddingBottom: 0,
                    paddingLeft: 1,
                    paddingTop: 0,
                    paddingRight: 3,
                    width: 200
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    verticalAlign: 'middle'
                  }}
                >
                  <Slider
                    className={classes.slider}
                    name={'slider-planeY'}
                    defaultValue={planeYValue}
                    onChange={handleChangePlanes}
                    step={stepPlanes}
                    min={bounds[2]}
                    max={bounds[3]}
                    valueLabelDisplay='auto'
                  />
                </Box>
              </div>
              <div
                style={{
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingRight: 1,
                  display: "flex",
                  alignItems: "center",
                  verticalAlign: "middle"
                }}
                className={classes.vtkText}
              >
                {planeYValue}
              </div>
            </div>
          </div>
          <div
            style={{
              alignItems: 'center',
              verticalAlign: 'middle',
              padding: 0
            }}
          >
            <div
              style={{
                paddingLeft: 6,
                display: 'flex',
                flexFlow: 'row',
                paddingTop: 2
              }}
              className={classes.vtkText}
            >
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
            <div style={{display: 'flex', flexFlow: 'row', padding: 0}}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  verticalAlign: 'middle',
                  padding: 0
                }}
              >
                <Box
                  sx={{
                    paddingBottom: 0,
                    paddingLeft: 1,
                    paddingTop: 0,
                    paddingRight: 3,
                    width: 200
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    verticalAlign: 'middle'
                  }}
                >
                  <Slider
                    className={classes.slider}
                    name={'slider-planeZ'}
                    defaultValue={planeZValue}
                    onChange={handleChangePlanes}
                    step={stepPlanes}
                    min={bounds[4]}
                    max={bounds[5]}
                    valueLabelDisplay='auto'
                  />
                </Box>
              </div>
              <div
                style={{
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingRight: 1,
                  display: "flex",
                  alignItems: "center",
                  verticalAlign: "middle"
                }}
                className={classes.vtkText}
              >
                {planeZValue}
              </div>
            </div>
          </div>
        </div>
      }
      {(sceneLoaded && showBoxStreams) &&
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
            <div
              style={{
                paddingLeft: 6,
                display: "flex",
                flexFlow: "row",
                paddingTop: 2
              }}
              className={classes.vtkText}
            >
              <span className={classes.vtkText}>
                Position X (m)
              </span>
              <span
                style={{
                  paddingLeft: 20
                }}
                className={classes.link}
                sx={{
                  height: '200px',
                  width: '200px'
                }}
                onClick={handleStreams}
              >
                {showStreams
                  ? <VisibilityIcon style={{width: '20px', height: '20px'}}/>
                  : <VisibilityOffIcon style={{width: '20px', height: '20px'}}/>
                }
              </span>
            </div>
            <div style={{display: 'flex', flexFlow: 'row', padding: 0}}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  verticalAlign: 'middle',
                  padding: 0
                }}
              >
                <Box
                  sx={{
                    paddingBottom: 0,
                    paddingLeft: 1,
                    paddingTop: 0,
                    paddingRight: 3,
                    width: 200
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    verticalAlign: 'middle'
                  }}
                >
                  <Slider
                    className={classes.slider}
                    name={'slider-streamsX'}
                    defaultValue={streamsXValue}
                    onChange={handleChangeStreams}
                    step={stepPlanes}
                    min={bounds[0]}
                    max={bounds[1]}
                    valueLabelDisplay='auto'
                  />
                </Box>
              </div>
              <div
                style={{
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingRight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  verticalAlign: 'middle'
                }}
                className={classes.vtkText}
              >
                {streamsXValue}
              </div>
            </div>
          </div>
          <div style={{alignItems: 'center', verticalAlign: 'middle', padding: 0}}>
            <div
              style={{
                paddingLeft: 6,
                display: 'flex',
                flexFlow: 'row',
                paddingTop: 2
              }}
              className={classes.vtkText}
            >
              <span className={classes.vtkText}>
                Position Y (m)
              </span>
            </div>
            <div style={{display: 'flex', flexFlow: 'row', padding: 0}}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  verticalAlign: 'middle',
                  padding: 0
                }}
              >
                <Box
                  sx={{
                    paddingBottom: 0,
                    paddingLeft: 1,
                    paddingTop: 0,
                    paddingRight: 3,
                    width: 200
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    verticalAlign: 'middle'
                  }}
                >
                  <Slider
                    className={classes.slider}
                    name={'slider-streamsY'}
                    defaultValue={streamsYValue}
                    onChange={handleChangeStreams}
                    step={stepPlanes}
                    min={bounds[2]}
                    max={bounds[3]}
                    valueLabelDisplay='auto'
                  />
                </Box>
              </div>
              <div
                style={{
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingRight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  verticalAlign: 'middle'
                }}
                className={classes.vtkText}
              >
                {streamsYValue}
              </div>
            </div>
          </div>
          <div
            style={{
              alignItems: 'center',
              verticalAlign: 'middle',
              padding: 0
            }}
          >
            <div
              style={{
                paddingLeft: 6,
                display: 'flex',
                flexFlow: 'row',
                paddingTop: 2
              }}
              className={classes.vtkText}
            >
              <span className={classes.vtkText}>
                Position Z (m)
              </span>
            </div>
            <div style={{display: 'flex', flexFlow: 'row', padding: 0}}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  verticalAlign: 'middle',
                  padding: 0
                }}
              >
                <Box
                  sx={{
                    paddingBottom: 0,
                    paddingLeft: 1,
                    paddingTop: 0,
                    paddingRight: 3,
                    width: 200
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    verticalAlign: 'middle'
                  }}
                >
                  <Slider
                    className={classes.slider}
                    name={'slider-streamsZ'}
                    defaultValue={streamsZValue}
                    onChange={handleChangeStreams}
                    step={stepPlanes}
                    min={bounds[4]}
                    max={bounds[5]}
                    valueLabelDisplay='auto'
                  />
                </Box>
              </div>
              <div
                style={{
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingRight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  verticalAlign: 'middle'
                }}
                className={classes.vtkText}
              >
                {streamsZValue}
              </div>
            </div>
          </div>
          <div
            style={{
              alignItems: 'center',
              verticalAlign: 'middle',
              padding: 0
            }}
          >
            <div
              style={{
                paddingLeft: 6,
                display: 'flex',
                flexFlow: 'row',
                paddingTop: 2
              }}
              className={classes.vtkText}
            >
              <span className={classes.vtkText}>
                Radius (m)
              </span>
            </div>
            <div style={{display: 'flex', flexFlow: 'row', padding: 0}}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  verticalAlign: 'middle',
                  padding: 0
                }}
              >
                <Box
                  sx={{
                    paddingBottom: 0,
                    paddingLeft: 1,
                    paddingTop: 0,
                    paddingRight: 3,
                    width: 200
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    verticalAlign: 'middle'
                  }}
                >
                  <Slider
                    className={classes.slider}
                    name={'slider-radius'}
                    defaultValue={radiusValue}
                    onChange={handleChangeStreams}
                    step={stepPlanes}
                    min={0}
                    max={0.1*Math.abs(Math.max(bounds[1], bounds[3], bounds[5])
                           - Math.min(bounds[0], bounds[2], bounds[4]))}
                    valueLabelDisplay='auto'
                  />
                </Box>
              </div>
              <div
                style={{
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingRight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  verticalAlign: 'middle'
                }}
                className={classes.vtkText}
              >
                {radiusValue}
              </div>
            </div>
          </div>
          <div
            style={{
              alignItems: 'center',
              verticalAlign: 'middle',
              padding: 0
            }}
          >
            <div
              style={{
                paddingLeft: 6,
                display: 'flex',
                flexFlow: 'row',
                paddingTop: 2
              }}
              className={classes.vtkText}
            >
              <span className={classes.vtkText}>
                Propagation (m)
              </span>
            </div>
            <div style={{display: 'flex', flexFlow: 'row', padding: 0}}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  verticalAlign: 'middle',
                  padding: 0
                }}
              >
                <Box
                  sx={{
                    paddingBottom: 0,
                    paddingLeft: 1,
                    paddingTop: 0,
                    paddingRight: 3,
                    width: 200
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    verticalAlign: 'middle'
                  }}
                >
                  <Slider
                    className={classes.slider}
                    name={'slider-propagation'}
                    defaultValue={propagationValue}
                    onChange={handleChangeStreams}
                    step={stepPlanes}
                    min={0}
                    max={1.0*Math.abs(Math.max(bounds[1], bounds[3], bounds[5])
                           - Math.min(bounds[0], bounds[2], bounds[4]))}
                    valueLabelDisplay='auto'
                  />
                </Box>
              </div>
              <div
                style={{
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingRight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  verticalAlign: 'middle'
                }}
                className={classes.vtkText}
              >
                {propagationValue}
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  )

}

export default ROMView;
