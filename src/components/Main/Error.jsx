import { useEffect } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { makeStyles } from '@mui/styles';
import { lightTheme, darkTheme } from './../theme';

function Error() {
  useEffect(() => {
    document.title = "About"
  }, []);

  const localTheme = window.localStorage.getItem('theme') || "light";
  const theme = localTheme === 'light' ? lightTheme : darkTheme;
  const useStyles = makeStyles(theme);
  const classes = useStyles();

  return (
    <div className={classes.root}>
        <Box style={{marginTop: "200px", fontSize: "30px", fontWeight: "700"}} sx={{ flexGrow: 1 }}>
        <Grid
          container
          alignItems="center"
	  justifyContent="center"
        >
          404 PAGE NOT FOUND
        </Grid>
        </Box>
    </div>
  );
}

export default Error;
