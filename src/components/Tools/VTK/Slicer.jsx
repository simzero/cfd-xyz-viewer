import { useEffect, useState } from 'react';

import { lightTheme, darkTheme } from './../../theme';
import GenericView  from './../../OF/GenericView';

import { makeStyles } from '@mui/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid'

import { DropzoneAreaBase } from "react-mui-dropzone";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro'

// - Tool custom data
const vtuVariable = "U";
const vtuTitle = "Velocity magnitude (m/s)";
const codeLink = 'src/components/Tools/VTK/Slicer.jsx';
const repoRoot = 'https://github.com/simzero-oss/cfd-xyz-data/blob/main/'
const simulationsLink = repoRoot + 'simulations_v1.0.0-rc.14.tar.gz?raw=true';
//

function Slicer() {
  useEffect(() => {
    document.title = "/Tools/Slicer"
  }, []);

  const localTheme = window.localStorage.getItem('theme') || "light";
  const theme = localTheme === 'light' ? lightTheme : darkTheme;
  const useStyles = makeStyles(theme);
  const classes = useStyles();

  const [files, setFiles] = useState([]);
  const [isConfirmed,setConfirmed] = useState(false);

  const handleAdd = newFiles => {
    newFiles = newFiles.filter(checkFile);
    newFiles = newFiles.filter(file => !files.find(f => f.data === file.data));
    setFiles([...files, ...newFiles]);
  };

  const handleDelete = deleted => {
    setFiles(files.filter(f => f !== deleted));
  };

  const handleFile = loadedFiles => {
    // console.log("loadedFiles: ", files)
  };

  const patterns = [
    '.*.vtu'
  ];

  function checkFile(item) {
    return item.file.name.match(patterns);
  }

  function clear() {
    setFiles([]);
  }

  const confirmed = async() => {
    setConfirmed(true);
  }

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
              <div className={classes.bodyText} style={{paddingTop: 6}}>
                - This tool is a generic slicer for 3D unstructured grids.
              </div>
              <div className={classes.bodyText} style={{paddingTop: 6}}>
                - Drag your .vtu file in the area below (or click and select)
                and confirm.
              </div>
              <div
                className={classes.bodyText}
                style={{
                  whiteSpace: 'pre-wrap',
                  paddingTop: 6
                }}
              >
                - You can generate .vtu files in OpenFOAM running the following
                command in the terminal:
                <code style={{fontFamily: 'monospace'}}>
                  {' foamToVTK -latestTime'}
                </code>
                  , and use in this tool the internal.vtu output in the VTK folder.
              </div>
              <div
                className={classes.bodyText}
                style={{
                  whiteSpace: 'pre-wrap',
                  paddingTop: 6
                }}
              >
                - For a try-out: download, extract, and drag one of the
                  internal.vtu files of this
                <a
                  href={simulationsLink}
                >
                  {' sample'}
                </a>.
              </div>
              <div className={classes.bodyText} style={{paddingTop: 6}}>
                - The files dragged and dropped will not be uploaded to any
                cloud or server, and will be processed locally in your device
                by the app.
              </div>
              <div className={classes.bodyText} style={{paddingTop: 6}}>
                - CURRENT LIMITATIONS: velocity magnitude is the only variable
                displayed.
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
                maxFileSize={300000000}
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
                <div spacing={50}>
                  <button
                    style={{ marginLeft: 2, marginRight: 10}}
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
            </Grid>
          </Grid>
        </Box>
      }
      { isConfirmed &&
        <div>
          <GenericView
            files={files}
            vtuVariable={vtuVariable}
            vtuTitle={vtuTitle}
            initialPlanesCoords={[0, 0, 0]}
            codeLink={codeLink}
          />
        </div>
      }
    </div>
  );
}

export default Slicer;
