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

import { createTheme } from '@mui/material/styles';
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
import rom from 'rom'
import Papa from 'papaparse'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import AttachFileIcon from '@mui/icons-material/AttachFile';
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro'
//import { faUpload, faTrash, faUndoAlt, faCameraRetro, faDownload } from '@fortawesome/fontawesome-free-solid';

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

  //const localTheme = window.localStorage.getItem('theme')
  const localTheme = window.localStorage.getItem('theme');
  const testVar = useState(window.localStorage.getItem('theme'));
  const theme = localTheme === 'light' ? lightTheme : darkTheme;
  const useStyles = makeStyles(theme);
  const classes = useStyles();

  const mainColor = theme.checkbox.color;

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
        const currentTheme = window.localStorage.getItem('theme');
        const background = currentTheme === 'light' ? backgroundLight : backgroundDark;
        const textColor = currentTheme === 'light' ? textColorLight : textColorDark;

        const scalarBarActorStyle1 = {
          paddingBottom: 30,
          fontColor:  textColor,
          fontStyle: 'normal',
          fontFamily: theme.vtkText.fontFamily
        };

        renderer.setBackground(background);
        scalarBarActor.setAxisTextStyle(scalarBarActorStyle1);
        scalarBarActor.setTickTextStyle(scalarBarActorStyle1);
        scalarBarActor.updateTextureAtlas();
        scalarBarActor.updatePolyDataForLabels();               
        scalarBarActor.completedImage();
        scalarBarActor.update();
        scalarBarActor.modified();
        renderWindow.modified();
        renderWindow.render();
      }
    }
  }, [testVar, backgroundLight, backgroundDark]);


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
      //fullScreenRenderer.setBackground(0.5,0.5,0.5);
      const renderer = fullScreenRenderer.getRenderer();
      const renderWindow = fullScreenRenderer.getRenderWindow();
      //const containerDimensions = vtkContainerRef.current.getBoundingClientRect();
      //vtkContainerRef.current.openglRenderWindow.setSize(containerDimensions.width, containerDimensions.height);
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
        const grid_file = files.find(item => item.file.name.match(".*.vtu"));
        const grid_data = grid_file.data.replace('data:application/octet-stream;base64,', '')
          reduced.readUnstructuredGrid(atob(grid_data));
          reduced.nu(nuIni*1e-05);
          reduced.solveOnline(new rom.Matrix([UIni]));
          //reduced.solveOnline(initialVelocity);
          const polydata_string = reduced.unstructuredGridToPolyData();
          // TODO: parse directly as buffer or parse as a string...
          var buf = Buffer.from(polydata_string, 'utf-8');
          reader.parseAsArrayBuffer(buf);
          polydata = reader.getOutputData(0);


          renderer.addActor(scalarBarActor);
          renderer.addActor(actor);

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
          scalarBarActor.setAxisTextStyle(scalarBarActorStyle);
          scalarBarActor.setTickTextStyle(scalarBarActorStyle);
          lookupTable.updateRange();
          scalarBarActor.modified();
          scalarBarActor.completedImage();
          renderer.resetCamera();
          renderer.getActiveCamera().zoom(1.3);
          renderWindow.render();
          renderer.resetCameraClippingRange();
          scalarBarActor.modified();
          scalarBarActor.setVisibility(false);
          renderWindow.render();
          renderWindow.modified();
          scalarBarActor.modified();
          scalarBarActor.update();
          scalarBarActor.updatePolyDataForLabels();
          scalarBarActor.updateTextureAtlas();
          scalarBarActor.completedImage();
          scalarBarActor.setVisibility(true);
          renderWindow.render();
          const camera = renderer.getActiveCamera();
          const focalPoint = [].concat(camera ? camera.getFocalPoint() : [0, 1, 2]);
          const cameraPosition = [].concat(camera ? camera.getPosition() : [0, 1, 2]);
          scalarBarActor.completedImage();

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

  const validFiles = [
    'B_mat.txt',
    'K_mat.txt',
    'M_mat.txt',
    'P_mat.txt',
    'EigenModes_U_mat.txt',
    'coeffL2_mat.txt',
    'par'
  ];

  const patterns = [
    'C.*_mat.txt|ct1_.*_mat.txt|ct2_.*_mat.txt|.*.vtu'
  ];

  function checkFile(item) {
    return validFiles.includes(item.file.name) ||
      item.file.name.match(patterns);
  }

  function checkAll(names) {
    //validFiles();
    //const B_check = ["B_mat.txt"].includes(item.file.name)
    //console.log(B_check)    
  }

  function clear() {
    setFiles([]);
  }


const readMatrixFile = async (data) => {
  return new Promise(resolve => {
    data = data.replace('data:text/plain;base64,', '')
    data = data.replace('data:application/octet-stream;base64,', '')
    Papa.parse(atob(data), {
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

  useEffect(() => {
    return () => {
      if (context.current) {
        const { reduced, fullScreenRenderer, polydata, actor, scalarBarActor, mapper } = context.current;
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

  function getData(name) {
    const element = files.find((item) => item.file.name === name)
    return element.data;
  }

  const confirmed = async() => {
    setNuMin(nuMin*1e05);
    setNuMax(nuMax*1e05);
    if (! UFixed)
    {
      const UMid = Number(UMin) + 0.5*(Number(UMax) - Number(UMin));
      setUIni(UMid);
      //setVelocityValue(UMid);
    }
    else
    {
      setUIni(UMin);
      //setVelocityValue(UMin);      
    }

    if (! nuFixed)
    {
      const nuMid = Number(nuMin) + 0.5*(Number(nuMax) - Number(nuMin));
      setNuIni(nuMid*1e05);
      //setViscosityValue(nuMid*1e05);
    }
    else
    {
      setNuIni(Number(nuMin*1e05));
      //setViscosityValue(nuMin*1e05);      
    }

    let loadedNames = []
    files.map((item) =>
      loadedNames.push(item.file.name)
    )

    const isTurbulent = loadedNames.includes("coeffL2_mat.txt")

    checkAll(loadedNames);
    setConfirmed(true);

    await rom.ready

    const B = new rom.Matrix(await readMatrixFile(getData("B_mat.txt")));
    const P = new rom.Matrix(await readMatrixFile(getData("P_mat.txt")));
    const M = new rom.Matrix(await readMatrixFile(getData("M_mat.txt")));
    const K = new rom.Matrix(await readMatrixFile(getData("K_mat.txt")));
    const modes = new rom.Matrix(await readMatrixFile(getData("EigenModes_U_mat.txt")));

    const mu = new rom.Matrix(await readMatrixFile(getData('par')));
    const Nphi_u = B.rows();
    const Nphi_p = K.cols();
    const N_BC = 1;

    const reduced = new rom.ReducedSteady(Nphi_u + Nphi_p, Nphi_u + Nphi_p);

    reduced.Nphi_u(Nphi_u);
    reduced.Nphi_p(Nphi_p);
    reduced.N_BC(N_BC);
    reduced.addMatrices(P, M, K, B);
    reduced.addModes(modes);

    P.delete();
    M.delete();
    K.delete();
    B.delete();
    modes.delete();

    let Nphi_nut = 0;
    (async () => {
      let indexes = []
      for (var i = 0; i < Nphi_u; i++ ) {
        indexes.push(i);
      }

      if (isTurbulent) {
        const coeffL2 = new rom.Matrix(await readMatrixFile(getData('coeffL2_mat.txt')));
        Nphi_nut = coeffL2.rows();
        reduced.Nphi_nut(Nphi_nut);
        let indexesNut = []
        for (var j = 0; j < Nphi_u; j++ ) {
          indexesNut.push(j);
        }

        await Promise.all(indexesNut.map(async (indexNut) => {
          const C1Path = 'ct1_' + indexNut + "_mat.txt"
          const C2Path = 'ct2_' + indexNut + "_mat.txt"
          const C1 = new rom.Matrix(await readMatrixFile(getData(C1Path)));
          const C2 = new rom.Matrix(await readMatrixFile(getData(C2Path)));
          reduced.addCt1Matrix(C1, indexNut);
          reduced.addCt2Matrix(C2, indexNut);
        }));
        reduced.setRBF(mu, coeffL2);
        coeffL2.delete();
      }

      await Promise.all(indexes.map(async (index) => {
        const CPath = 'C' + index + "_mat.txt"
        const C = new rom.Matrix(await readMatrixFile(getData(CPath)));
        reduced.addCMatrix(C, index);
      }));

      reduced.preprocess();
      //reduced.nu(nuMin*1e-05);
      context.current = { reduced };
      setDataLoaded(true);
    })();

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
     //renderer.update();
     renderer.getActiveCamera().zoom(1.3);
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
           var a = document.createElement("a"); //Create <a>
           a.innerHTML = 'download';
           //a.href = "data:image/png;base64," + image; //Image Base64 Goes here
           a.href = URL.createObjectURL(blob);
           a.download = "pitzDaily_nu_" + viscosityValue + ".png";//File name Here
           a.click(); //Downloaded file
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
       var a = document.createElement("a"); //Create <a>
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
      reduced.solveOnline(new rom.Matrix([velocityValue]));
      //reduced.solveOnline(velocityValue);
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
    }
  }, [viscosityValue, velocityValue]);

  const handleAdd = newFiles => {
    setDisabled(true);
    newFiles = newFiles.filter(checkFile);
    newFiles = newFiles.filter(file => !files.find(f => f.data === file.data));
    setFiles([...files, ...newFiles]);
    setDisabled(false);
  };



  const handleDelete = deleted => {
    setFiles(files.filter(f => f !== deleted));
  };

  const handleFile = loadedFiles => {
    console.log("loadedFiles: ", files)
  };


  return (
    <div className={classes.root}>
      { ! isConfirmed &&
        <Box sx={{ flexGrow: 1 }}>
          <div
            className={classes.titleText}
          >
              Instructions
          </div>
          <div
            className={classes.bodyText}
            style={{ display: "flex", marginTop: 0, marginLeft: 60, marginRight: 0, marginBottom: 10}}
          >
              - This tool hanldes data generated by ITHACA-FV SteadyNS and SteadyNSTurb classes (limited to 2D cases in current version).
          </div>
          <div
            className={classes.bodyText}
            style={{ display: "flex", marginTop: 0, marginLeft: 60, marginRight: 0, marginBottom: 10}}
          >
              - Drag your ITHACAoutput folder in the area below, set ranges and confirm.
          </div>
          <div
            className={classes.bodyText}
            style={{ display: "flex", marginTop: 0, marginLeft: 60, marginRight: 0, marginBottom: 40}}
          >
              - The files will not be uploaded to any cloud or server, and will be processed locally in your device by this app.
          </div>
          <Grid
            container
            spacing={5}
            justifyContent="center"
            display="flex"
          >
            <Grid item item xs={9}>
              <DropzoneAreaBase
                classes={{  root: classes.dropzone, active: classes.dropzoneActive, textContainer: classes.vtkText,  text: classes.vtkText}}
                Icon={() =>
                  <FontAwesomeIcon
                    className={classes.dropzoneIcon}
                    icon={solid('upload')}
                  />
                }
                dropzoneText={<div className={classes.dropzoneText}>Drag and drop here or click </div>}
                previewText={<div className={classes.bodyText}>Preview files:</div>}
                dropzoneParagraphClass={classes.dropzoneText}
                inputProps={{ classes: { root: classes.dropzone } }}
                previewChipProps={{ classes: { label: classes.dropzonePreview } }}
                dropzoneProps={{ disabled: isDisabled, classes: { root: classes.dropzoneText } }}
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
            </Grid>
            <Grid item xs='auto'>
              <div className={classes.bodyText} style={{ marginBottom: 10 }}>
                Inlet velocity (m/s)
              </div>
              <Box>
                <FormGroup spacing={10} display="inlineBlock" row={true}>
                  <TextField
                    id="U-min"
                    variant="outlined"
                    className={classes.textField}
          label=" min"
          type="number"
          defaultValue="1.0"
          onChange={(event) => {setUMin(event.target.value)}}
        />
        <TextField
          id="U-max"
          variant="outlined"
          className={classes.textField}
	            style={{ marginLeft: 15 }}
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
       <div className={classes.bodyText} style={{ marginBottom: 10, marginTop: 15 }}>
        Kinematic viscosity
       </div>
    </Box>
    <FormGroup margin='20px' row={true}>
        <TextField
          id="nu-min"
          variant="outlined"
          className={classes.textField}
          //InputProps={{
          //classes: {
          //  root: classes.cssOutlinedInput,
          //  focused: classes.cssFocused,
          //  notchedOutline: classes.notchedOutline
          //}
          // className: classes.input,
          //}}
          /*InputLabelProps={{
          classes: {
            root: classes.cssLabel,
            focused: classes.cssFocused,
          },
          }}*/
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
	            style={{ marginLeft: 15 }}
          //InputProps={{
          //classes: {
          //  root: classes.cssOutlinedInput,
          //  focused: classes.cssFocused,
           // notchedOutline: classes.notchedOutline
          //}
          // className: classes.input,
          //}}
          /*InputLabelProps={{
          classes: {
            root: classes.cssLabel,
            focused: classes.cssFocused,
          },
          }}*/
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
      style={{ marginTop: 20, marginLeft: 22, marginRight: 10}}
      type="button"
      className={classes.buttons}
      onClick={clear}>
        Clear
    </button>
       <button
        type="button"
      //  className="btn btn-success mr-3"
        className={classes.buttons}
        onClick={confirmed}>
        Confirm
       </button>
</div>
</div>

</Grid>
</Grid>
</Box>
}
{ isConfirmed &&
<div> 
      <div style={{ paddingBottom: 60}} ref={vtkContainerRef}>
      </div>
        <div
          style={{
            paddingBottom: 80,
            //padding: 10,
            position: 'absolute',
            backgroundColor: background,
            top: '60px',
            right: '170px',
            padding: '5px',
            marginRight: '2%',
            border: '1px solid rgba(125, 125, 125)',
          }}
        >
          <Box className={classes.link} sx={{ height: '34px', width: '34px' }} onClick={restart}>
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
            //padding: 10,
            position: 'absolute',
            top: '60px',
            right: '20px',
            backgroundColor: background,
            padding: '5px',
            marginRight: '2%',
            border: '1px solid rgba(125, 125, 125)',
          }}
        >
          <Box className={classes.link} sx={{ height: '34px', width: '34px' }} onClick={downloadData}>
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
            //padding: 10,
            position: 'absolute',
            top: '60px',
            right: '70px',
            backgroundColor: background,
            padding: '5px',
            marginRight: '2%',
            border: '1px solid rgba(125, 125, 125)',
          }}
        >
           <Box className={classes.link} sx={{ height: '34px', width: '34px' }} onClick={takeScreenshot}>
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
            //padding: 10,
            position: 'absolute',
            top: '60px',
            right: '120px',
            backgroundColor: background,
            padding: '5px',
            marginRight: '2%',
            border: '1px solid rgba(125, 125, 125)',
          }}
        >
          <Box className={classes.link} sx={{ height: '34px', width: '34px' }} onClick={resetCamera}>
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
                Kinematic viscosity (m2/s)
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
            </div>}
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
            </div>}
          </div>
      </div>
</div> 
}
  </div>
  );
}

export default Steady;
