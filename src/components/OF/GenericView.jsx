import { React, useCallback, useEffect, useRef, useState } from "react";
import debounce from "lodash/debounce";
import { makeStyles } from "@mui/styles";
import { lightTheme, darkTheme } from './../theme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Slider from '@mui/material/Slider';
import IconButton from '@mui/material/IconButton';
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro'

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import rom from '@simzero/rom'
import hexRgb from 'hex-rgb';
import useWindowOrientation from "use-window-orientation";
import {isMobile} from 'react-device-detect';
import PropagateLoader from "react-spinners/PropagateLoader";
import {Buffer} from 'buffer';
import LayersIcon from '@mui/icons-material/Layers';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CodeIcon from '@mui/icons-material/Code';

import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkXMLPolyDataReader from '@kitware/vtk.js/IO/XML/XMLPolyDataReader';
import vtkColorMaps from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkScalarBarActor from '@kitware/vtk.js/Rendering/Core/ScalarBarActor';
import vtkOutlineFilter from '@kitware/vtk.js/Filters/General/OutlineFilter';
const { ColorMode } = vtkMapper;

const GenericView = ({
    vtuPath,
    vtuVariable,
    vtuTitle,
    vtpPath,
    vtpVariable,
    vtpTitle,
    MB,
    initialPlanesCoords,
    step,
    caseLink
  }) => {

  const { orientation, portrait, landscape } = useWindowOrientation();
  const initialPortrait = portrait;
  const context = useRef(null);
  const vtkContainerRef = useRef(null);
  const localTheme = window.localStorage.getItem('theme') || "light"
  const trackTheme = useState(window.localStorage.getItem('theme') || "light");
  const [doIncrementX, setDoIncrementX] = useState(false);
  const [doDecrementX, setDoDecrementX] = useState(false);
  const [busyIncrementX, setBusyIncrementX] = useState(false);
  const [busyDecrementX, setBusyDecrementX] = useState(false);
  const [incrementX, setIncrementX] = useState(false);
  const [decrementX, setDecrementX] = useState(false);
  const [doIncrementY, setDoIncrementY] = useState(false);
  const [doDecrementY, setDoDecrementY] = useState(false);
  const [busyIncrementY, setBusyIncrementY] = useState(false);
  const [busyDecrementY, setBusyDecrementY] = useState(false);
  const [incrementY, setIncrementY] = useState(false);
  const [decrementY, setDecrementY] = useState(false);
  const [doIncrementZ, setDoIncrementZ] = useState(false);
  const [doDecrementZ, setDoDecrementZ] = useState(false);
  const [busyIncrementZ, setBusyIncrementZ] = useState(false);
  const [busyDecrementZ, setBusyDecrementZ] = useState(false);
  const [incrementZ, setIncrementZ] = useState(false);
  const [decrementZ, setDecrementZ] = useState(false);
  const theme = localTheme === 'light' ? lightTheme : darkTheme;
  const mainSecondaryColor = theme.palette.primary2Color;
  const useStyles = makeStyles(theme);
  const classes = useStyles();
  const [ready, setIsReady] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [planeXValue, setPlaneXValue] = useState(null);
  const [planeYValue, setPlaneYValue] = useState(null);
  const [planeZValue, setPlaneZValue] = useState(null);
  const [boundsTest, setBoundsTest] = useState([0, 0, 0, 0, 0, 0]);
  const [showPlanes, setShowPlanes] = useState(false);
  const [showPlaneX, setShowPlaneX] = useState(false);
  const [showPlaneY, setShowPlaneY] = useState(false);
  const [showPlaneZ, setShowPlaneZ] = useState(false);
  const [modifiedPlaneX, setModifiedPlaneX] = useState(false);
  const [modifiedPlaneY, setModifiedPlaneY] = useState(false);
  const [modifiedPlaneZ, setModifiedPlaneZ] = useState(false);
  const initialPlaneX = initialPlanesCoords[0];
  const initialPlaneY = initialPlanesCoords[1];
  const initialPlaneZ = initialPlanesCoords[2];

  const repo = 'https://github.com/simzero-oss/cfd-xyz/blob/main/'
  const link = repo + caseLink;

  const preset = vtkColorMaps.getPresetByName('erdc_rainbow_bright');

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

  useEffect(() => {
    if (context.current && !busyIncrementX)
    {
      setBusyIncrementX(true);
      setDoIncrementX(!doIncrementX);
    }
  }, [incrementX]);

  useEffect(() => {
    if (context.current && !busyDecrementX)
    {
      setBusyDecrementX(true);
      setDoDecrementX(!doDecrementX);
    }
  }, [decrementX]);

  useEffect(() => {
    if (context.current)
    {
      handleIncrementX();
    }
  }, [doIncrementX]);

  useEffect(() => {
    if (context.current)
    {
      handleDecrementX();
    }
  }, [doDecrementX]);

  useEffect(() => {
    if (context.current && !busyIncrementY)
    {
      setBusyIncrementY(true);
      setDoIncrementY(!doIncrementY);
    }
  }, [incrementY]);

  useEffect(() => {
    if (context.current && !busyDecrementY)
    {
      setBusyDecrementY(true);
      setDoDecrementY(!doDecrementY);
    }
  }, [decrementY]);

  useEffect(() => {
    if (context.current)
    {
      handleIncrementY();
    }
  }, [doIncrementY]);

  useEffect(() => {
    if (context.current)
    {
      handleDecrementY();
    }
  }, [doDecrementY]);

  useEffect(() => {
    if (context.current && !busyIncrementZ)
    {
      setBusyIncrementZ(true);
      setDoIncrementZ(!doIncrementZ);
    }
  }, [incrementZ]);

  useEffect(() => {
    if (context.current && !busyDecrementZ)
    {
      setBusyDecrementZ(true);
      setDoDecrementZ(!doDecrementZ);
    }
  }, [decrementZ]);

  useEffect(() => {
    if (context.current)
    {
      handleIncrementZ();
    }
  }, [doIncrementZ]);

  useEffect(() => {
    if (context.current)
    {
      handleDecrementZ();
    }
  }, [doDecrementZ]);

  const handleIncrementX = () => {
    let newValue = planeXValue + step;
    newValue = Math.min(Math.max(newValue, boundsTest[0]), boundsTest[1]);
    setPlaneXValue(newValue);
    calculateNewFieldX();
    setBusyIncrementX(false);
  }

  const handleDecrementX = () => {
    let newValue = planeXValue - step;
    newValue = Math.min(Math.max(newValue, boundsTest[0]), boundsTest[1]);
    setPlaneXValue(newValue);
    calculateNewFieldX();
    setBusyDecrementX(false);
  }

  const handleIncrementY = () => {
    let newValue = planeYValue + step;
    newValue = Math.min(Math.max(newValue, boundsTest[2]), boundsTest[3]);
    setPlaneYValue(newValue);
    calculateNewFieldY();
    setBusyIncrementY(false);
  }

  const handleDecrementY = () => {
    let newValue = planeYValue - step;
    newValue = Math.min(Math.max(newValue, boundsTest[2]), boundsTest[3]);
    setPlaneYValue(newValue);
    calculateNewFieldY();
    setBusyDecrementY(false);
  }

  const handleIncrementZ = () => {
    let newValue = planeZValue + step;
    newValue = Math.min(Math.max(newValue, boundsTest[4]), boundsTest[5]);
    setPlaneZValue(newValue);
    calculateNewFieldZ();
    setBusyIncrementZ(false);
  }

  const handleDecrementZ = () => {
    let newValue = planeZValue - step;
    newValue = Math.min(Math.max(newValue, boundsTest[4]), boundsTest[5]);
    setPlaneZValue(newValue);
    calculateNewFieldZ();
    setBusyDecrementZ(false);
  }

  const handlePlaneXInput = (event, newValue) => {
    newValue = Math.min(Math.max(newValue, boundsTest[0]), boundsTest[1]);
    setPlaneXValue(newValue);
  };

  const handlePlaneYInput = (event, newValue) => {
    newValue = Math.min(Math.max(newValue, boundsTest[2]), boundsTest[3]);
    setPlaneYValue(newValue);
  };

  const handlePlaneZInput = (event, newValue) => {
    newValue = Math.min(Math.max(newValue, boundsTest[4]), boundsTest[5]);
    setPlaneZValue(newValue);
  };

  // - Show/hide planes
  const handleSetShowPlanes = () => {
    setShowPlanes(!showPlanes);
    if (context.current) {
      const { scalarBarActor, actorPlaneX, actorPlaneY, actorPlaneZ, mapper, scalarBarActorPlaneX } = context.current;
      if (showPlanes) {
        actorPlaneX.setVisibility(false);
        actorPlaneY.setVisibility(false);
        actorPlaneZ.setVisibility(false);
        scalarBarActorPlaneX.setVisibility(false);
        mapper.setColorByArrayName(vtpVariable)
        scalarBarActor.setVisibility(true);
      }
      if (!showPlanes) {
        mapper.setColorByArrayName("solid")
        scalarBarActor.setVisibility(false);
        scalarBarActorPlaneX.setVisibility(true);
        if (showPlaneX)
          actorPlaneX.setVisibility(true);
        if (showPlaneY)
          actorPlaneY.setVisibility(true);
        if (showPlaneZ)
          actorPlaneZ.setVisibility(true);
      }
    }
  };

  const handlePlaneXChange = (event, newValue) => {
    setPlaneXValue(newValue);
    stateDebounceMyFunction("slider-tate", newValue);
  };

  const handlePlaneYChange = (event, newValue) => {
    setPlaneYValue(newValue);
    stateDebounceMyFunction("slider-tate", newValue);
  };

  const handlePlaneZChange = (event, newValue) => {
    setPlaneZValue(newValue);
    stateDebounceMyFunction("slider-tate", newValue);
  };

  const myFunction = (eventSrcDesc, newValue) => {
    // console.log({ eventSrcDesc, newValue });
  };

  const [stateDebounceMyFunction] = useState(() =>
    debounce(myFunction, 300, {
      leading: false,
      trailing: true
    })
  );

  function takeScreenshot() {
    if (context.current) {
     const { renderWindow } = context.current;
     renderWindow.captureImages()[0].then(
       (image) => {
         (async () => {
           const blob = await (await fetch(image)).blob();
           var a = document.createElement("a");
           a.innerHTML = 'download';
           a.href = URL.createObjectURL(blob);
           a.download = "motorBike.png";
           a.click();
         })();
       }
     );
    }
  }

  function setScene(portrait, VTK, reader, context, vtkContainerRef, theme) {
    console.log("setScene")
    const actor = vtkActor.newInstance();
    const scalarBarActor = vtkScalarBarActor.newInstance();
    const scalarBarActorPlaneX = vtkScalarBarActor.newInstance();
    const lookupTable = vtkColorTransferFunction.newInstance();
    const lookupTablePlaneX = vtkColorTransferFunction.newInstance();
    const lookupTablePlaneY = vtkColorTransferFunction.newInstance();
    const lookupTablePlaneZ = vtkColorTransferFunction.newInstance();
    const mapper = vtkMapper.newInstance({
      interpolateScalarsBeforeMapping: true,
      colorByArrayName: vtpVariable,
      colorMode: ColorMode.DEFAULT,
      scalarMode: 'pointData',
      useLookupTableScalarRange: true,
      lookupTable,
    });
    const mapperPlaneX = vtkMapper.newInstance({
      interpolateScalarsBeforeMapping: true,
      colorByArrayName: vtuVariable,
      colorMode: ColorMode.DEFAULT,
      scalarMode: 'pointData',
      useLookupTableScalarRange: true,
      lookupTablePlaneX,
    });
    const mapperPlaneY = vtkMapper.newInstance({
      interpolateScalarsBeforeMapping: true,
      colorByArrayName: vtuVariable,
      colorMode: ColorMode.DEFAULT,
      scalarMode: 'pointData',
      useLookupTableScalarRange: true,
      lookupTablePlaneY,
    });
    const mapperPlaneZ = vtkMapper.newInstance({
      interpolateScalarsBeforeMapping: true,
      colorByArrayName: vtuVariable,
      colorMode: ColorMode.DEFAULT,
      scalarMode: 'pointData',
      useLookupTableScalarRange: true,
      lookupTablePlaneZ,
    });
    mapperPlaneX.setScalarModeToUsePointFieldData();
    mapperPlaneY.setScalarModeToUsePointFieldData();
    mapperPlaneZ.setScalarModeToUsePointFieldData();
    lookupTablePlaneX.setVectorModeToMagnitude();
    lookupTablePlaneY.setVectorModeToMagnitude();
    lookupTablePlaneZ.setVectorModeToMagnitude();
    lookupTablePlaneX.applyColorMap(preset);
    lookupTablePlaneY.applyColorMap(preset);
    lookupTablePlaneZ.applyColorMap(preset);
    actor.setMapper(mapper);
    mapper.setLookupTable(lookupTable);
    scalarBarActor.setVisibility(false);
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
    lookupTable.setVectorModeToMagnitude();
    lookupTable.applyColorMap(preset);
    lookupTable.updateRange();

    const polydata = reader.getOutputData(0);
    //VTK.readUnstructuredGrid(ugrid);

    // - Define the outline
    const readerOutline = vtkXMLPolyDataReader.newInstance();
    const polydataStringOutline = VTK.unstructuredGridToPolyData();
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
    //mapper_outline.setInputData(polydata_outline);
    const actorOutline = vtkActor.newInstance();
    actorOutline.setMapper(mapperOutline);
    actorOutline.getProperty().set({ lineWidth: 2 });
    actorOutline.getProperty().setColor(textColorLoader);
    renderer.addActor(actorOutline);

    polydata.getPointData().setActiveScalars(vtpVariable);
    const activeArray = polydata.getPointData().getArray(vtpVariable);
    const dataRange = [].concat(activeArray ? activeArray.getRange() : [0, 1]);
    lookupTable.setMappingRange(dataRange[0], dataRange[1]);

    renderer.addActor(scalarBarActor);
    renderer.addActor(scalarBarActorPlaneX);
    renderer.addActor(actor);

    actor.setMapper(mapper);
    scalarBarActor.setVisibility(true);
    scalarBarActor.setScalarsToColors(mapper.getLookupTable());

    scalarBarActorPlaneX.setScalarsToColors(mapperPlaneX.getLookupTable());
    scalarBarActorPlaneX.setVisibility(false);

    mapper.setScalarRange(dataRange[0],dataRange[1]);
    mapper.setInputData(polydata);
    mapper.setLookupTable(lookupTable);
    mapper.setScalarModeToUsePointFieldData();

    const planeReader = vtkXMLPolyDataReader.newInstance();
    const actorPlaneX = vtkActor.newInstance();
    const actorPlaneY = vtkActor.newInstance();
    const actorPlaneZ = vtkActor.newInstance();

    let polydata_string = VTK.planeX(planeXValue);
    let buf = Buffer.from(polydata_string, 'utf-8');
    planeReader.parseAsArrayBuffer(buf);
    const planeX = planeReader.getOutputData(0);

    polydata_string = VTK.planeX(planeYValue);
    buf = Buffer.from(polydata_string, 'utf-8');
    planeReader.parseAsArrayBuffer(buf);
    const planeY = planeReader.getOutputData(0);

    polydata_string = VTK.planeZ(planeYValue);
    buf = Buffer.from(polydata_string, 'utf-8');
    planeReader.parseAsArrayBuffer(buf);
    const planeZ = planeReader.getOutputData(0);

    actorPlaneX.setMapper(mapperPlaneX);
    actorPlaneY.setMapper(mapperPlaneY);
    actorPlaneZ.setMapper(mapperPlaneZ);
    mapperPlaneX.setInputData(planeX);
    mapperPlaneY.setInputData(planeY);
    mapperPlaneZ.setInputData(planeZ);

    actorPlaneX.setVisibility(false);
    actorPlaneY.setVisibility(false);
    actorPlaneZ.setVisibility(false);

    if (portrait)
      renderer.getActiveCamera().zoom(0.55);
    else
      renderer.getActiveCamera().zoom(1.5);

    renderer.getActiveCamera().setPosition(-1.0, 0, 0.0);
    renderer.getActiveCamera().setViewUp(0.0, 0.0, 1.0)
    renderer.resetCamera();
    renderWindow.render();

    const camera = renderer.getActiveCamera();
    const focalPoint = [].concat(camera ? camera.getFocalPoint() : [0, 1, 2]);
    const cameraPosition = [].concat(camera ? camera.getPosition() : [0, 1, 2]);

    renderer.addActor(actorPlaneX);
    renderer.addActor(actorPlaneY);
    renderer.addActor(actorPlaneZ);
    actorPlaneX.setMapper(mapperPlaneX);
    actorPlaneY.setMapper(mapperPlaneY);
    actorPlaneZ.setMapper(mapperPlaneZ);

    context.current = {
      VTK,
      bounds,
      planeReader,
      planeX,
      planeY,
      planeZ,
      actorOutline,
      actorPlaneX,
      actorPlaneY,
      actorPlaneZ,
      focalPoint,
      cameraPosition,
      reader,
      fullScreenRenderer,
      renderWindow,
      renderer,
      lookupTable,
      lookupTablePlaneY,
      lookupTablePlaneX,
      lookupTablePlaneZ,
      polydata,
      actor,
      scalarBarActor,
      scalarBarActorPlaneX,
      mapper,
      mapperPlaneX,
      mapperPlaneY,
      mapperPlaneZ
    };
  }

  const initialize = async() => {
    if (!context.current) {
      await rom.ready;
      const VTK = new rom.VTK();
      context.current = { VTK };
      setIsReady(true);
    }
  }

  // - Update scene with theme
  useEffect(() => {
    if (context.current) {
      const { mapper, renderer, renderWindow, scalarBarActor, scalarBarActorPlaneX, actorOutline } = context.current;
      if (renderWindow) {
        const background = localTheme === 'light' ? backgroundLight : backgroundDark;
        const textColor = localTheme === 'light' ? textColorLight : textColorDark;
        let textColorNorm = hexRgb(textColor, {format: 'array'});
        textColorNorm = textColorNorm.map(x => x / 255);
        textColorNorm.pop();

        const scalarBarActorStyle1 = {
          paddingBottom: 30,
          fontColor: textColor,
          fontStyle: 'normal',
          fontFamily: theme.vtkText.fontFamily
        };

        renderer.setBackground(background);
        scalarBarActor.setAxisTextStyle(scalarBarActorStyle1);
        scalarBarActorPlaneX.setAxisTextStyle(scalarBarActorStyle1);
        scalarBarActor.setTickTextStyle(scalarBarActorStyle1);
        scalarBarActorPlaneX.setTickTextStyle(scalarBarActorStyle1);
        scalarBarActor.setAxisLabel(vtpTitle);
        scalarBarActorPlaneX.setAxisLabel(vtuTitle);
        scalarBarActor.setScalarsToColors(mapper.getLookupTable());
        scalarBarActor.modified();
        scalarBarActorPlaneX.modified();
        actorOutline.getProperty().setColor(textColorNorm);
        renderWindow.render();
      }
    }
  }, [trackTheme, localTheme, textColorLight, textColorDark, backgroundLight, backgroundDark, theme.vtkText.fontFamily]);

  useEffect(() => {
    if (context.current && ready) {
      (async () => {
        const { VTK } = context.current;
        const data = await fetch(vtuPath);
        const response = await data.text();
        await VTK.readUnstructuredGrid(response);
        setDataLoaded(true);
      })();
    }
  }, [ready]);

  useEffect(() => {
    if (dataLoaded) {
      //async () => {
      const { VTK } = context.current;
      const reader = vtkXMLPolyDataReader.newInstance();
      reader
        .setUrl(vtpPath, {loadData: true } )
        .then(() => {
            setScene(initialPortrait, VTK, reader, context, vtkContainerRef, localTheme);
            setSceneLoaded(true);
        });
    }
  }, [dataLoaded]);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (context.current && sceneLoaded) {
       setShowPlaneX(true);
       setShowPlaneY(true);
       setShowPlaneZ(true);
    }
  }, [sceneLoaded]);

  useEffect(() => {
    if (!context.current) {
      setPlaneXValue(initialPlaneX)
      setPlaneYValue(initialPlaneY)
      setPlaneZValue(initialPlaneZ)
      initialize();
    }
  }, []);

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

  const resetCamera = useCallback(
    () => {
      if (context.current) {
       const { fullScreenRenderer, focalPoint, cameraPosition, renderer, renderWindow } = context.current;
       renderer.getActiveCamera().setProjectionMatrix(null);
       const offset = Math.sqrt( (cameraPosition[0]-focalPoint[0])**2 + (cameraPosition[1]-focalPoint[1])**2 + (cameraPosition[2]-focalPoint[2])**2 )
       renderer.getActiveCamera().setPosition(cameraPosition[0], cameraPosition[1], cameraPosition[2] + offset);
       renderer.getActiveCamera().setPosition(-1.0, 0, 0.0);
       renderer.getActiveCamera().setViewUp(0.0, 0.0, 1.0)
       renderer.resetCamera();
       fullScreenRenderer.resize();
       if (portrait)
         renderer.getActiveCamera().zoom(0.55);
       else
         renderer.getActiveCamera().zoom(1.5);
       renderWindow.render();
      }
    }
  );

  // - Color new slices
  useEffect(() => {
    if (context.current) {
     //var start = new Date().getTime();	    
     const { planeX, planeY, planeZ, lookupTablePlaneX, mapperPlaneX, lookupTablePlaneY, mapperPlaneY, lookupTablePlaneZ, mapperPlaneZ, renderWindow, scalarBarActorPlaneX } = context.current;

     const activeArrayX = planeX.getPointData().getArray(vtuVariable);
     const dataRangeX = [].concat(activeArrayX ? activeArrayX.getRange() : [0, 1]);
     const activeArrayY = planeY.getPointData().getArray(vtuVariable);
     const dataRangeY = [].concat(activeArrayY ? activeArrayY.getRange() : [0, 1]);
     const activeArrayZ = planeZ.getPointData().getArray(vtuVariable);
     const dataRangeZ = [].concat(activeArrayZ ? activeArrayZ.getRange() : [0, 1]);

     planeX.getPointData().setActiveScalars(vtuVariable);
     planeY.getPointData().setActiveScalars(vtuVariable);
     planeZ.getPointData().setActiveScalars(vtuVariable);

     let min;
     let max;

     if (showPlaneX && showPlaneY && showPlaneZ) {
       min = Math.min(dataRangeX[0], dataRangeY[0], dataRangeZ[0])
       max = Math.max(dataRangeX[1], dataRangeY[1], dataRangeZ[1])
     }
     if (!showPlaneX && showPlaneY && showPlaneZ) {
       min = Math.min(dataRangeY[0], dataRangeZ[0])
       max = Math.max(dataRangeY[1], dataRangeZ[1])
     }
     if (showPlaneX && !showPlaneY && showPlaneZ) {
       min = Math.min(dataRangeX[0], dataRangeZ[0])
       max = Math.max(dataRangeX[1], dataRangeZ[1])
     }
     if (showPlaneX && showPlaneY && !showPlaneZ) {
       min = Math.min(dataRangeX[0], dataRangeY[0])
       max = Math.max(dataRangeX[1], dataRangeY[1])
     }
     if (showPlaneX && !showPlaneY && !showPlaneZ) {
       min = dataRangeX[0];
       max = dataRangeX[1];
     }
     if (!showPlaneX && showPlaneY && !showPlaneZ) {
       min = dataRangeY[0];
       max = dataRangeY[1];
     }
     if (!showPlaneX && !showPlaneY && showPlaneZ) {
       min = dataRangeZ[0];
       max = dataRangeZ[1];
     }

     lookupTablePlaneX.setMappingRange(min, max);
     lookupTablePlaneY.setMappingRange(min, max);
     lookupTablePlaneZ.setMappingRange(min, max);
     mapperPlaneX.setScalarRange(min, max);
     mapperPlaneY.setScalarRange(min, max);
     mapperPlaneZ.setScalarRange(min, max);
     scalarBarActorPlaneX.setScalarsToColors(mapperPlaneX.getLookupTable());
     scalarBarActorPlaneX.modified();
     lookupTablePlaneX.updateRange();
     lookupTablePlaneY.updateRange();
     lookupTablePlaneZ.updateRange();
     renderWindow.render();
     //var end = new Date().getTime();
     //var time = end - start;
    }
  }, [modifiedPlaneX, modifiedPlaneY, modifiedPlaneZ]);

  const calculateNewFieldX = () => {
    if (context.current) {
      const { planeX, actorPlaneX, lookupTablePlaneX, mapperPlaneX, planeReader, VTK } = context.current;
      const polydata_string = VTK.planeX(planeXValue);
      const buf = Buffer.from(polydata_string, 'utf-8');
      planeReader.parseAsArrayBuffer(buf);
      planeX.shallowCopy(planeReader.getOutputData(0));
 
      actorPlaneX.setMapper(mapperPlaneX);
      mapperPlaneX.setInputData(planeX);
      mapperPlaneX.setLookupTable(lookupTablePlaneX);
      setModifiedPlaneX(modifiedPlaneX => !modifiedPlaneX);
    }
  }

  const calculateNewFieldY = () => {
    if (context.current) {
     const { planeY, actorPlaneY, lookupTablePlaneY, mapperPlaneY, VTK } = context.current;
     const planeReader = vtkXMLPolyDataReader.newInstance();
     const polydata_string = VTK.planeY(planeYValue);
     const buf = Buffer.from(polydata_string, 'utf-8');
     planeReader.parseAsArrayBuffer(buf);
     planeY.shallowCopy(planeReader.getOutputData(0));

     actorPlaneY.setMapper(mapperPlaneY);
     mapperPlaneY.setInputData(planeY);
     mapperPlaneY.setLookupTable(lookupTablePlaneY);
     setModifiedPlaneY(modifiedPlaneY => !modifiedPlaneY);
    }
  }

  const calculateNewFieldZ = () => {
    if (context.current) {
     const { planeZ, actorPlaneZ, lookupTablePlaneZ, mapperPlaneZ, VTK } = context.current;
     const planeReader = vtkXMLPolyDataReader.newInstance();
     const polydata_string = VTK.planeZ(planeZValue);
     const buf = Buffer.from(polydata_string, 'utf-8');
     planeReader.parseAsArrayBuffer(buf);
     planeZ.shallowCopy(planeReader.getOutputData(0));

     actorPlaneZ.setMapper(mapperPlaneZ);
     mapperPlaneZ.setInputData(planeZ);
     mapperPlaneZ.setLookupTable(lookupTablePlaneZ);
     setModifiedPlaneZ(modifiedPlaneZ => !modifiedPlaneZ);
    }
  }

  // - Define new X slice
  useEffect(() => {
    if (context.current && sceneLoaded) {
      calculateNewFieldX();
    }
  }, [showPlaneX, planeXValue]);

  // - Define new Y slice
  useEffect(() => {
    if (context.current && sceneLoaded) {
      calculateNewFieldY();
    }
  }, [showPlaneY, planeYValue]);

 // - Define new Z slice
  useEffect(() => {
    if (context.current && sceneLoaded) {
      calculateNewFieldZ();
    }
  }, [showPlaneZ, planeZValue]);

  useEffect(() => {
    return () => {
      if (context.current) {
        const  {
          VTK,
          planeReader,
          planeX,
          planeY,
          planeZ,
          actorOutline,
          actorPlaneX,
          actorPlaneY,
          actorPlaneZ,
          reader,
          fullScreenRenderer,
          renderWindow,
          renderer,
          lookupTable,
          lookupTablePlaneY,
          lookupTablePlaneX,
          lookupTablePlaneZ,
          polydata,
          actor,
          scalarBarActor,
          scalarBarActorPlaneX,
          mapper,
          mapperPlaneX,
          mapperPlaneY,
          mapperPlaneZ
    } = context.current
          VTK.delete();
          planeReader.delete();
          planeX.delete();
          planeY.delete();
          planeZ.delete();
          actorOutline.delete();
          actorPlaneX.delete();
          actorPlaneY.delete();
          actorPlaneZ.delete();
          reader.delete();
          fullScreenRenderer.delete();
          renderWindow.delete();
          renderer.delete();
          lookupTable.delete();
          lookupTablePlaneY.delete();
          lookupTablePlaneX.delete();
          lookupTablePlaneZ.delete();
          polydata.delete();
          actor.delete();
          scalarBarActor.delete();
          scalarBarActorPlaneX.delete();
          mapper.delete();
          mapperPlaneX.delete();
          mapperPlaneY.delete();
          mapperPlaneZ.delete();
          context.current = null;
      }
    };
  }, []);

  return (
    <div ref={vtkContainerRef}>
        {(!sceneLoaded) &&
            <div
              style={{
                position: 'absolute', left: '50%', top: '45%',
                transform: 'translate(-50%, -50%)'
              }}
              className={classes.bodyText}
            >
              <div
                style={{
                  textAlign: 'center',
                  paddingBottom: 20,
                }}
              >
                Loading {MB} MB of data {dataLoaded}
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
                  paddingBottom: 20,
                }}
              >
                <div>Control view tips</div>
                <div> * Rotate: left mouse</div>
                <div> * Pan: left mouse + shift</div>
                <div> * Spin: left mouse + crtl/alt</div>
                <div> * Zoom: mouse wheel</div>
              </div>
            </div>
        }
        {(sceneLoaded) &&
          <div>
          <div
            style={{
              paddingBottom: 80,
              position: 'absolute',
              bottom: '75px',
              left: '10px',
              backgroundColor: background,
              padding: '5px',
              marginRight: '2%'
            }}
          >
            <IconButton
              edge={false}
              style={{ border: "5px", outline: "5px", color: mainSecondaryColor }}
              aria-label="mode"
              href={link}
              target="_blank"
              rel="noreferrer"
              title={'Code'}
            >
              {<CodeIcon />}
            </IconButton>
          </div>
            <div
              style={{
                paddingBottom: 60,
                position: 'absolute',
                top: '60px',
                right: landscape ? '40px' : '20px',
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
                right: landscape ? '90px' : '70px',
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
              className={showPlanes ? classes.viewButtonsPressed : null}
            >
              <Box className={classes.link} sx={{ height: '34px', width: '34px' }} onClick={handleSetShowPlanes}>
                <LayersIcon
                  style={{width: '32px', height: '32px'}}
                />
              </Box>
            </div>
          </div>
        }
        {(sceneLoaded && showPlanes && isMobile) &&
        <div
          style={{
            position: 'absolute',
            top: '122px',
            right: '185px',
            backgroundColor: background
          }}
        >
          <span style={{paddingRight: 5}} className={classes.link} sx={{ height: '300px', width: '300px' }} onClick={handlePlaneX}>
          {showPlaneX
            ? <VisibilityIcon style={{width: '24px', height: '24px'}}/>
            : <VisibilityOffIcon style={{width: '24px', height: '24px'}}/>
          }
          </span>
        </div>
        }
        {(sceneLoaded && showPlanes && isMobile) &&
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
            className={!busyIncrementX ? classes.link : classes.viewButtonsPressed}
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
                (!busyIncrementX
                  ?
                    () => {
                      setIncrementX(!incrementX)
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
              id="X"
              variant="outlined"
              align="right"
              className={classes.textField}
              label="x (m)"
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
              value={planeXValue}
              onChange={(event) => {
                handlePlaneXInput(event,event.target.value);
                event.preventDefault();
              }}
            />
          </div>
          <div
            style={{
              paddingBottom: 60,
              position: 'absolute',
              right: '100px',
              padding: '5px',
              border: '1px solid',
            }}
            className={!busyDecrementX ? classes.link : classes.viewButtonsPressed}
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
                (!busyDecrementX
                  ?
                    () => {
                      setDecrementX(!decrementX)
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
        {(sceneLoaded && showPlanes && isMobile) &&
        <div
          style={{
            position: 'absolute',
            top: '182px',
            right: '185px',
            backgroundColor: background
          }}
        >
          <span style={{paddingRight: 5}} className={classes.link} sx={{ height: '300px', width: '300px' }} onClick={handlePlaneY}>
          {showPlaneY
            ? <VisibilityIcon style={{width: '24px', height: '24px'}}/>
            : <VisibilityOffIcon style={{width: '24px', height: '24px'}}/>
          }
          </span>
        </div>
        }
        {(sceneLoaded && showPlanes && isMobile) &&
        <div
          style={{
            position: 'absolute',
            top: '170px',
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
            className={!busyIncrementY ? classes.link : classes.viewButtonsPressed}
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
                (!busyIncrementY
                  ?
                    () => {
                      setIncrementY(!incrementY)
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
              id="Y"
              variant="outlined"
              align="right"
              className={classes.textField}
              label="y (m)"
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
              value={planeYValue}
              onChange={(event) => {
                handlePlaneYInput(event,event.target.value);
                event.preventDefault();
              }}
            />
          </div>
          <div
            style={{
              paddingBottom: 60,
              position: 'absolute',
              right: '100px',
              padding: '5px',
              border: '1px solid',
            }}
            className={!busyDecrementY ? classes.link : classes.viewButtonsPressed}
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
                (!busyDecrementY
                  ?
                    () => {
                      setDecrementY(!decrementY)
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
        {(sceneLoaded && showPlanes && isMobile) &&
        <div
          style={{
            position: 'absolute',
            top: '237px',
            right: '185px',
            backgroundColor: background
          }}
        >
          <span style={{paddingRight: 5}} className={classes.link} sx={{ height: '300px', width: '300px' }} onClick={handlePlaneZ}>
          {showPlaneZ
            ? <VisibilityIcon style={{width: '24px', height: '24px'}}/>
            : <VisibilityOffIcon style={{width: '24px', height: '24px'}}/>
          }
          </span>
        </div>
        }
        {(sceneLoaded && showPlanes && isMobile) &&
        <div
          style={{
            position: 'absolute',
            top: '225px',
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
            className={!busyIncrementZ ? classes.link : classes.viewButtonsPressed}
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
                (!busyIncrementZ
                  ?
                    () => {
                      setIncrementZ(!incrementZ)
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
              id="Y"
              variant="outlined"
              align="right"
              className={classes.textField}
              label="z (m)"
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
              value={planeZValue}
              onChange={(event) => {
                handlePlaneZInput(event,event.target.value);
                event.preventDefault();
              }}
            />
          </div>
          <div
            style={{
              paddingBottom: 60,
              position: 'absolute',
              right: '100px',
              padding: '5px',
              border: '1px solid',
            }}
            className={!busyDecrementZ ? classes.link : classes.viewButtonsPressed}
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
                (!busyDecrementZ
                  ?
                    () => {
                      setDecrementZ(!decrementZ)
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
        {(sceneLoaded && showPlanes && !isMobile) &&
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
                    defaultValue={initialPlaneX}
                    onChange={handlePlaneXChange}
                    step={step}
                    min={boundsTest[0]}
                    max={boundsTest[1]}
                    valueLabelDisplay="on"
                  />
                </Box>
              </div>
            <div>
              <span style={{paddingRight: 5}} className={classes.link} sx={{ height: '200px', width: '200px' }} onClick={handlePlaneX}>
                {showPlaneX
                  ? <VisibilityIcon style={{width: '24px', height: '24px'}}/>
                  : <VisibilityOffIcon style={{width: '24px', height: '24px'}}/>
                }
              </span>
              <span className={classes.vtkText}>
                Plane X (m)
              </span>
            </div>
              <div style={{marginTop: '10%'}}>
                <Box sx={{ width: 300 }}>
                  <Slider
                    className={classes.slider}
                    defaultValue={initialPlaneY}
                    onChange={handlePlaneYChange}
                    step={step}
                    min={boundsTest[2]}
                    max={boundsTest[3]}
                    valueLabelDisplay="on"
                  />
                </Box>
              </div>
            <div>
              <span style={{paddingRight: 5}} className={classes.link} sx={{ height: '200px', width: '200px' }} onClick={handlePlaneY}>
                {showPlaneY
                  ? <VisibilityIcon style={{width: '24px', height: '24px'}}/>
                  : <VisibilityOffIcon style={{width: '24px', height: '24px'}}/>
                }
              </span>
              <span className={classes.vtkText}>
                Plane Y (m)
              </span>
            </div>
              <div style={{marginTop: '18%'}}>
                <Box sx={{ width: 300 }}>
                  <Slider
                    className={classes.slider}
                    defaultValue={initialPlaneZ}
                    onChange={handlePlaneZChange}
                    step={step}
                    min={boundsTest[4]}
                    max={boundsTest[5]}
                    valueLabelDisplay="on"
                  />
                </Box>
              </div>
            <div>
              <span style={{paddingRight: 5}} className={classes.link} sx={{ height: '200px', width: '200px' }} onClick={handlePlaneZ}>
                {showPlaneZ
                  ? <VisibilityIcon style={{width: '24px', height: '24px'}}/>
                  : <VisibilityOffIcon style={{width: '24px', height: '24px'}}/>
                }
              </span>
              <span className={classes.vtkText}>
                Plane Z (m)
              </span>
            </div>
          </div>
        </div>
      }
    </div>
  )

}

export default GenericView;
