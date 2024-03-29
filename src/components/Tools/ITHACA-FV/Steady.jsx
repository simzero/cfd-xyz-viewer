// Copyright (c) 2022 Carlos Peña-Monferrer. All rights reserved.
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

import {Buffer} from 'buffer';

import { useState, useRef, useEffect } from 'react';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';

import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Checkbox from '@mui/material/Checkbox'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'

import { DropzoneAreaBase } from "react-mui-dropzone";

import { makeStyles } from '@mui/styles';

import hexRgb from 'hex-rgb';

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
import { lightTheme, darkTheme } from './../../theme';
import rom from '@simzero/rom'
import jszip from 'jszip'
import JSZipUtils from 'jszip-utils'
import Papa from 'papaparse'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro'
import PropagateLoader from "react-spinners/PropagateLoader";

const initialZoom = 1.3;

const { ColorMode } = vtkMapper;

var background = [255, 255, 255];

function Steady() {
  useEffect(() => {
    document.title = "cfd.xyz | Tools/ITHACA-FV_Steady"
  }, []);

  const vtkContainerRef = useRef(null);
  const context = useRef(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [UFixed, setUFixed] = useState(false);
  const [nuFixed, setNuFixed] = useState(false);

  const localTheme = window.localStorage.getItem('theme') || "light";
  const trackTheme = useState(window.localStorage.getItem('theme') || "light");
  const theme = localTheme === 'light' ? lightTheme : darkTheme;
  const useStyles = makeStyles(theme);
  const classes = useStyles();

  const mainColor = theme.checkbox.color;
  const textColorLoader = localTheme ===
    'light' ? lightTheme.bodyText.color : darkTheme.bodyText.color;

  let backgroundLight = hexRgb(lightTheme.body, {format: 'array'});
  let backgroundDark = hexRgb(darkTheme.body, {format: 'array'});
  backgroundLight = backgroundLight.map(x => x / 255); 
  backgroundDark = backgroundDark.map(x => x / 255); 
  backgroundLight.pop();
  backgroundDark.pop();

  let textColorLight = lightTheme.vtkText.color;
  let textColorDark = darkTheme.vtkText.color;

  const [files, setFiles] = useState([]);
  const [isConfirmed,setConfirmed] = useState(false);
  const [isDisabled,setDisabled] = useState(false);
  const [UMin, setUMin] = useState(1);
  const [UIni, setUIni] = useState(5);
  const [UMax, setUMax] = useState(10);
  const [nuMin, setNuMin] = useState(1e-06)
  const [nuIni, setNuIni] = useState(1e-05)
  const [nuMax, setNuMax] = useState(1e-04)
  const [velocityValue, setVelocityValue] = useState();
  const [viscosityValue, setViscosityValue] = useState();

  useEffect(() => {
    if (context.current) {
      const { scalarBarActor, renderer, renderWindow } = context.current;
      if (renderWindow) {
        const background = localTheme === 'light' ? backgroundLight : backgroundDark;
        const textColor = localTheme === 'light' ? textColorLight : textColorDark;

        const scalarBarActorStyle1 = {
          paddingBottom: 30,
          fontColor:  textColor,
          fontStyle: 'normal',
          fontFamily: theme.vtkText.fontFamily
        };

        renderer.setBackground(background);
        scalarBarActor.setAxisTextStyle(scalarBarActorStyle1);
        scalarBarActor.setTickTextStyle(scalarBarActorStyle1);
        scalarBarActor.modified();
        renderWindow.modified();
        renderWindow.render();
      }
    }
  }, [trackTheme, localTheme, backgroundLight, backgroundDark]);


  useEffect(() => {
    if (context.current) {
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
      const renderWindow = fullScreenRenderer.getRenderWindow();
      const preset = vtkColorMaps.getPresetByName('erdc_rainbow_bright');
      lookupTable.setVectorModeToMagnitude();
      lookupTable.applyColorMap(preset);
      lookupTable.updateRange();
      let polydata;
      const scalarBarActorStyle = {
        paddingBottom: 30,
        fontColor: theme.vtkText.color,
        fontStyle: 'normal',
        fontFamily: theme.vtkText.fontFamily
      };

      reduced.nu(nuIni*1e-05);
      reduced.solveOnline(UIni, 0.0);
      const polydata_string = reduced.unstructuredGridToPolyData();
      // TODO: parse directly as buffer or parse as a string...
      var buf = Buffer.from(polydata_string, 'utf-8');
      reader.parseAsArrayBuffer(buf);
      polydata = reader.getOutputData(0);

      renderer.addActor(scalarBarActor);
      renderer.addActor(actor);

      reduced.reconstruct();
      const newU = reduced.geometry();

      var nCells = polydata.getNumberOfPoints();
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
      scalarBarActor.setAxisTextStyle(scalarBarActorStyle);
      scalarBarActor.setTickTextStyle(scalarBarActorStyle);
      lookupTable.updateRange();
      scalarBarActor.modified();
      renderer.resetCamera();
      renderer.getActiveCamera().zoom(initialZoom);
      renderWindow.render();
      renderer.resetCameraClippingRange();
      scalarBarActor.modified();
      scalarBarActor.setVisibility(false);
      renderWindow.render();
      renderWindow.modified();
      scalarBarActor.modified();
      scalarBarActor.setVisibility(true);

      const camera = renderer.getActiveCamera();
      let focalPoint = [].concat(camera ? camera.getFocalPoint() : [0, 1, 2]);
      let cameraPosition = [].concat(camera ? camera.getPosition() : [0, 1, 2]);

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
      setVelocityValue(UIni);
      setViscosityValue(nuIni);
    }
  }, [dataLoaded]);

  const patterns = [
    '.*.zip'
  ];

  function checkZip(item) {
    return item.file.name.match(patterns);
  }

  function checkAll(names) {
    //validFiles();
    //const B_check = ["B_mat.txt"].includes(item.file.name)
    //console.log(B_check)    
  }

  function clear() {
    setFiles([]);
  }

  const readFile = async (buffer) => {
    const csvData = buffer.toString();

    return new Promise(resolve => {
        Papa.parse(csvData, {
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
    const buffer = Buffer.from(await item.async('arraybuffer'))
    const data = await readFile(buffer);
    const transposed = data[0].map((col, i) => data.map(row => row[i]));
    const transposedBuffer = Float64Array.from(transposed.flat());

    return [transposedBuffer, data.length, data[0].length];
  }

  useEffect(() => {
    return () => {
      if (context.current) {
        const {
          reduced,
          fullScreenRenderer,
          polydata,
          actor,
          scalarBarActor,
          mapper
        } = context.current;
        reduced.delete();
        actor.delete();
        scalarBarActor.delete();
        mapper.delete();
        polydata.delete();
        fullScreenRenderer.delete();
        context.current = null;
      }
    };
  }, []);

  const confirmed = async() => {
    setNuMin(nuMin*1e05);
    setNuMax(nuMax*1e05);
    if (! UFixed)
    {
      const UMid = Number(UMin) + 0.5*(Number(UMax) - Number(UMin));
      setUIni(UMid);
    }
    else
    {
      setUIni(UMin);
    }

    if (! nuFixed)
    {
      const nuMid = Number(nuMin) + 0.5*(Number(nuMax) - Number(nuMin));
      setNuIni(nuMid*1e05);
    }
    else
    {
      setNuIni(Number(nuMin*1e05));
    }

    let loadedNames = []
    files.map((item) =>
      loadedNames.push(item.file.name)
    )

    const zipContent = await JSZipUtils.getBinaryContent(files[0].data);
    const zipFiles = await jszip.loadAsync(zipContent);
    const zipKeys = Object.keys(zipFiles.files);

    const isTurbulent = zipKeys.includes("coeffL2_mat.txt")

    checkAll(loadedNames);
    setConfirmed(true);

    await rom.ready

    const nBC = 2;

    const KData = await loadData(zipFiles, "K_mat.txt");
    const BData = await loadData(zipFiles, "B_mat.txt");
    const modesData = await loadData(zipFiles, 'EigenModes_U_mat.txt');
    const coeffL2Data = await loadData(zipFiles, 'coeffL2_mat.txt');
    const muData = await loadData(zipFiles, 'par.txt');
    const gridItem = zipFiles.files['internal.vtu'];
    const gridData = Buffer.from(await gridItem.async('arraybuffer'));

    const nPhiU = BData[1];
    const nPhiP = KData[2];
    const nPhiNut = coeffL2Data[1];
    const nRuns = coeffL2Data[2];

    const reduced = new rom.reducedSteady(nPhiU + nPhiP, nPhiU + nPhiP);

    let stabilization = 'supremizer';

    if (zipKeys.includes("D_mat.txt")) {
      stabilization = 'PPE';
    }

    reduced.stabilization(stabilization);
    reduced.nPhiU(nPhiU);
    reduced.nPhiP(nPhiP);
    reduced.nPhiNut(nPhiNut);
    reduced.nRuns(nRuns);
    reduced.nBC(nBC);

    reduced.readUnstructuredGrid(gridData);
    reduced.initialize();

    reduced.K().set(KData[0]);
    reduced.B().set(BData[0]);

    if (stabilization === "supremizer") {
      const PData = await loadData(zipFiles, 'P_mat.txt');

      reduced.P().set(PData[0]);
    }
    else if (stabilization === "PPE") {
      const DData = await loadData(zipFiles, 'D_mat.txt');
      const BC3Data = await loadData(zipFiles, 'BC3_mat.txt');

      reduced.D().set(DData[0]);
      reduced.BC3().set(BC3Data[0]);
    }
    else {
      // TODO: check
    }

    reduced.modes().set(modesData[0]);

    let indexes = []
    for (var i = 0; i < nPhiU; i++ ) {
      indexes.push(i);
    }

    await Promise.all(indexes.map(async (index) => {
      const CPath = 'C' + index + "_mat.txt"
      const CData = await loadData(zipFiles, CPath);

      reduced.C().set(CData[0]);
      reduced.addCMatrix();
    }));

    if (stabilization === "PPE") {
      let indexesP = []
      for (var j = 0; j < nPhiP; j ++ ) {
        indexesP.push(j);
      }

      await Promise.all(indexesP.map(async (index) => {
        const GPath = 'G' + index + "_mat.txt"
        const GData = await loadData(zipFiles, GPath);

        reduced.G().set(GData[0]);
        reduced.addGMatrix();
      }));
    }

    if (isTurbulent) {
      // const coeffL2Data = await loadData(zipFiles, 'coeffL2_mat.txt');

      let indexesNut = []
      for (var j = 0; j < nPhiNut; j ++ ) {
        indexesNut.push(j);
      }

      await Promise.all(indexes.map(async (index) => {
        const C1Path = 'ct1_' + index + "_mat.txt"
        const C2Path = 'ct2_' + index + "_mat.txt"
        const C1Data = await loadData(zipFiles, C1Path);
        const C2Data = await loadData(zipFiles, C2Path);

        reduced.Ct1().set(C1Data[0]);
        reduced.addCt1Matrix();
        reduced.Ct2().set(C2Data[0]);
        reduced.addCt2Matrix();
      }));

      await Promise.all(indexesNut.map(async (indexNut) => {
        const weightsPath = 'wRBF_' + indexNut + '_mat.txt';
        const weightsData = await loadData(zipFiles, weightsPath);

        reduced.weights().set(weightsData[0]);
        reduced.addWeights();
      }));
    }

    reduced.mu().set(muData[0]);
    reduced.coeffL2().set(coeffL2Data[0]);
    reduced.setRBF();

    context.current = { reduced };
    setDataLoaded(true);
  }

  const resetCamera = () => {
    if (context.current) {
     const {
       fullScreenRenderer,
       focalPoint,
       cameraPosition,
       renderer,
       renderWindow
     } = context.current;
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
     renderer.getActiveCamera().zoom(initialZoom);
     renderWindow.render();
    }
  }

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
           a.download = "pitzDaily_nu_" + viscosityValue + ".png";
           a.click();
         })();
       }
     );
    }
  }

  function handleUFixed() {
    if (!UFixed) {
      setUMax(UMin);
      setVelocityValue(UMin);
      setUIni(UMin);
    }
    setUFixed(!UFixed)
  }

  function handleNuFixed() {
    if (!nuFixed) {
      setNuMax(nuMin);
      setViscosityValue(nuMin);
      setNuIni(nuMin);
    }
    setNuFixed(!nuFixed)
  }

  function restart() {
    // TODO: this is temporal
    window.location.reload();
  }

  function downloadData() {
    if (context.current) {
      const { reduced } = context.current;
      const data_string = reduced.exportUnstructuredGrid();
      var blob = new Blob([data_string], {
        type: 'text/plain'
      });
       var a = document.createElement("a");
       a.innerHTML = 'download';
       a.href = URL.createObjectURL(blob);
       a.download = "pitzDaily_nu_" + viscosityValue + "_U_" + velocityValue + ".vtu";
       a.click();
    }
  }

  const myFunction = (eventSrcDesc, newValue) => {
    // console.log({ eventSrcDesc, newValue });
  };

  const handleViscosityChange = (event, newValue) => {
    setViscosityValue(newValue);
    stateDebounceMyFunction("slider-tate", newValue);
  };

  const handleVelocityChange = (event, newValue) => {
    setVelocityValue(newValue);
    stateDebounceMyFunction("slider-tate", newValue);
  };

  const [stateDebounceMyFunction] = useState(() =>
    debounce(myFunction, 300, {
      leading: false,
      trailing: true
    })
  );

  useEffect(() => {
    if (context.current) {
      const { polydata, reduced, lookupTable, renderWindow, mapper } = context.current;
      reduced.nu(viscosityValue*1e-05);
      reduced.solveOnline(velocityValue, 0.0);
      reduced.reconstruct();
      const newU = reduced.geometry();
      polydata.getPointData().removeArray('uRec');
      var nCells = polydata.getNumberOfPoints();
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
      polydata.getPointData().setScalars(array)
      polydata.getPointData().addArray(array);
      polydata.getPointData().setActiveScalars("uRec");
      const dataRange = [].concat(array ? array.getRange() : [0, 1]);
      lookupTable.setMappingRange(dataRange[0], dataRange[1]);
      lookupTable.updateRange();
      mapper.setScalarRange(dataRange[0],dataRange[1]);
      mapper.update();
      renderWindow.render();
    }
  }, [viscosityValue, velocityValue]);

  const handleAdd = async newFiles => {
    setDisabled(true);
    newFiles = newFiles.filter(checkZip);
    newFiles = newFiles.filter(file => !files.find(f => f.data === file.data));
    setFiles([...files, ...newFiles]);
    setDisabled(false);
  };

  const handleDelete = deleted => {
    setFiles(files.filter(f => f !== deleted));
  };

  const handleFile = loadedFiles => {
    // console.log("loadedFiles: ", files)
  };

  return (
    <div className={classes.root}>
      { ! isConfirmed &&
        <Box sx={{ flexGrow: 1 }}>
          <Grid
            container
            direction="row"
            alignItems="center"
            justifyContent="center"
          >
            <Grid item md={11}>
              <div
                className={classes.titleText}
                style={{
                  marginTop: 10
                }}
              >
                Instructions
              </div>
              <div className={classes.bodyText}>
                - This tool handles data generated by ITHACA-FV SteadyNS and
                SteadyNSTurb classes (limited to 2D cases in this version).
              </div>
              <div className={classes.bodyText} style={{paddingTop: 6}}>
                - Drag your ITHACAoutput folder in the area below, set ranges
                and confirm.
              </div>
              <div className={classes.bodyText} style={{paddingTop: 6}}>
                - For a try-out: download and drag the following
                ZIP
                <a
                  href={'https://github.com/simzero-oss/cfd-xyz-data/blob/main/surrogates_v1.1.0/OF/incompressible/simpleFoam/pitzDaily.zip?raw=true'}
                >
                  {' sample'}
                </a>.
              </div>
              <div className={classes.bodyText} style={{paddingTop: 6}}>
                - The files dragged and dropped will not be uploaded to any cloud or server, and
                will be processed locally in your device by the app.
              </div>
            </Grid>
            <Grid item md={11} style={{padding: 12, paddingTop: 24}}>
              <div className={classes.dropzone}>
              <DropzoneAreaBase
                classes={{
                  root: classes.dropzone,
                  active: classes.dropzoneActive,
                  textContainer: classes.vtkText,
                  text: classes.vtkText
                }}
                Icon={() =>
                  <FontAwesomeIcon
                    className={classes.dropzoneIcon}
                    icon={solid('upload')}
                  />
                }
                dropzoneText={
                  <div className={classes.dropzoneText}>
                    Drag and drop here or click
                  </div>
                }
                previewText={
                  <div className={classes.bodyText}>
                    Preview files:
                  </div>
                }
                dropzoneParagraphClass={classes.dropzoneText}
                inputProps={{ classes: { root: classes.dropzone } }}
                previewChipProps={{ classes: { label: classes.dropzonePreview } }}
                filesLimit={1000}
                maxFileSize={30000000}
                showFileNamesInPreview={true}
                showFileNames={true}
                showPreviews={true}
                showPreviewsInDropzone={false}
                useChipsForPreview={true}
                showAlerts={false}
                fileObjects={files}
                onAdd={handleAdd}
                onDelete={handleDelete}
                onDrop={handleFile}
              />
              </div>
            </Grid>
            <Grid item md={11} style={{padding: 12}}>
              <div>
              <div className={classes.bodyText} style={{ marginBottom: 10 }}>
                Inlet velocity (m/s)
              </div>
              <Box>
                <FormGroup spacing={10} display="inlineBlock" row={true}>
                  <TextField
                    id="U-min"
                    variant="outlined"
                    className={classes.textField}
                    style={{ width: '100px' }}
                    label=" min"
                    type="number"
                    defaultValue="1.0"
                    onChange={(event) => {setUMin(event.target.value)}}
                  />
                  <TextField
                    id="U-max"
                    variant="outlined"
                    className={classes.textField}
                    style={{ marginLeft: 15, width: '100px' }}
                    label=" max"
                    type="number"
                    defaultValue="10.0"
                    disabled={UFixed}
                    onChange={(event) => {setUMax(event.target.value)}}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        style ={{
                          color: mainColor,
                          marginLeft: 8
                        }}
                        checked={UFixed}
                        onChange={handleUFixed}
                      />
                    }
                    className={classes.bodyText}
                    labelPlacement="end"
                    label={<div className={classes.controlLabel}>Fixed?</div>}
                  />
                </FormGroup>
              </Box>
              <div>
                <Box>
                  <div
                    className={classes.bodyText}
                    style={{ marginBottom: 10, marginTop: 15 }}
                  >
                    Kinematic viscosity
                  </div>
                </Box>
                <FormGroup margin='20px' row={true}>
                  <TextField
                    id="nu-min"
                    variant="outlined"
                    className={classes.textField}
                    style={{ width: '100px' }}
                    label="min"
                    type="number"
                    defaultValue="1e-04"
                    inputProps={{ inputMode: 'decimal', pattern: '[0-9]*' }}
                    onChange={(event) => {setNuMin(event.target.value)}}
                  />
                  <TextField
                    id="nu-max"
                    variant="outlined"
                    className={classes.textField}
                    style={{ marginLeft: 15, width: '100px' }}
                    label="max"
                    type="number"
                    defaultValue="1e-06"
                    disabled={nuFixed}
                    inputProps={{ inputMode: 'decimal', pattern: '[0-9]*' }}
                    onChange={(event) => {setNuMax(event.target.value)}}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        style ={{
                          color: mainColor,
                          marginLeft: 8
                        }}
                        checked={nuFixed}
                        onChange={handleNuFixed}
                      />
                    }
                    className={classes.bodyText}
                    labelPlacement="end"
                    label={<div className={classes.controlLabel}>Fixed?</div>}
                  />
                </FormGroup>
                <div spacing={50}>
                  <button
                    style={{ marginTop: 20, marginLeft: 2, marginRight: 10}}
                    type="button"
                    className={classes.buttons}
                    onClick={clear}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className={classes.buttons}
                    onClick={confirmed}>
                      Confirm
                  </button>
                </div>
              </div>
              </div>
            </Grid>
          </Grid>
        </Box>
      }
      { isConfirmed &&
      <div>
        <div ref={vtkContainerRef}>
        {!dataLoaded &&
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
              Loading and reading data...
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
        {dataLoaded &&
          <div>
            <div
              style={{
                paddingBottom: 80,
                position: 'absolute',
                backgroundColor: background,
                top: '60px',
                right: '170px',
                padding: '5px',
                marginRight: '2%',
               border: '1px solid rgba(125, 125, 125)',
              }}
            >
              <Box
                className={classes.link}
                sx={{ height: '34px', width: '34px' }}
                onClick={restart}
              >
                <FontAwesomeIcon
                  title="Delete"
                  style={{width: '32px', height: '32px'}}
                  icon={solid('trash')}
                />          
              </Box>
            </div>
          <div
            style={{
              paddingBottom: 80,
              position: 'absolute',
              top: '60px',
              right: '20px',
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
              <FontAwesomeIcon
                title="Download"
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
              right: '70px',
              backgroundColor: background,
              padding: '5px',
              marginRight: '2%',
              border: '1px solid rgba(125, 125, 125)',
            }}
          >
            <Box
              className={classes.link}
              sx={{ height: '34px', width: '34px' }}
              onClick={takeScreenshot}
            >
              <FontAwesomeIcon
                title="Screenshot"
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
              right: '120px',
              backgroundColor: background,
              padding: '5px',
              marginRight: '2%',
             border: '1px solid rgba(125, 125, 125)',
            }}
          >
            <Box
              className={classes.link}
              sx={{ height: '34px', width: '34px' }}
              onClick={resetCamera}
            >
              <FontAwesomeIcon
                title="Reset camera"
                style={{width: '32px', height: '32px'}}
                icon={solid('undo-alt')}
              />
            </Box>
          </div>
          <div
            style={{
              paddingTop: '100px',
              paddingBottom: 60,
              padding: 10,
              position: 'absolute',
              top: '60px',
              left: '20px',
              backgroundColor: background,
              //padding: '15px',
              border: '1px solid rgba(125, 125, 125)',
            }}
          >
            <div>
              { ! nuFixed &&
                <div style={{marginTop: '2%'}}>
                  <Box sx={{ width: 300 }}>
                    <Slider
                      className={classes.slider}
                      defaultValue={nuIni}
                      onChange={handleViscosityChange}
                      step={(Number(nuMax)-Number(nuMin))/100}
                      min={nuMin}
                      max={nuMax}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </div>}
              { ! nuFixed &&
                <div>
                  <div className={classes.vtkText}>
                    Kinematic viscosity (m2/s) x1e-05
                  </div>
                </div>
              }
              { nuFixed &&
                <div className={classes.vtkText}>
                  Kinematic viscosity (m2/s): {viscosityValue}
                </div>
              }
              { ! UFixed &&
                <div style={{marginTop: '10%'}}>
                  <Box sx={{ width: 300 }}>
                    <Slider
                      className={classes.slider}
                      defaultValue={UIni}
                      onChange={handleVelocityChange}
                      step={0.1}
                      min={UMin}
                      max={UMax}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </div>
            }
            { ! UFixed &&
              <div>
                <div className={classes.vtkText}>
                  Inlet velocity (m/s)
               </div>
              </div>}
            {  UFixed &&
              <div style={{marginTop: '10%'}}>
                <div className={classes.vtkText}>
                  Inlet velocity (m/s): {velocityValue}
                </div>
              </div>
            }
            </div>
          </div>
      </div>
      }
    </div>
  }
  </div>
  );
}

export default Steady;
