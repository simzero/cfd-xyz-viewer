import { React, useEffect } from "react";
import Grid from '@mui/material/Grid'
import ShowCards  from './ShowCards';
import { makeStyles } from "@mui/styles";
import posts from "./list";
import { global } from '../theme';

function Home() {
  useEffect(() => {
   document.title = "cfd.xyz"
  }, []);

  const useStyles = makeStyles(global);
  const classes = useStyles();

  return (
    <div className={classes.root} align="center">
      <Grid
        container
        spacing={3}
        display="flex"
        flexDirection="row"
      >
        {posts.map(post => (
           <ShowCards key={post.key} post={post} />
        ))}
      </Grid>
    </div>
  );
}

export default Home;
