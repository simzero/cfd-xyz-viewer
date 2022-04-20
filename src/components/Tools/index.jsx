// Copyright (c) 2022 Carlos Peña-Monferrer. All rights reserved.
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

import { useEffect } from "react";
import { makeStyles } from "@mui/styles";
import { Link } from "react-router-dom";
import posts from "./list";
import { lightTheme, darkTheme } from './../theme';

function Tools() {

  useEffect(() => {
   document.title = "Tools"
  }, []);

  //const classes = useStyles();
  const localTheme = window.localStorage.getItem('theme')
  const theme = localTheme === 'light' ? lightTheme : darkTheme;
  const useStyles = makeStyles(theme);
  const classes = useStyles();

  return (
    <div className={classes.root} align="left">
      {posts.map(post => (
        <Link to={post.link} className={classes.link}>
          <div className={classes.cardTextTools} key={post.key}>
           {post.title}
          </div>
        </Link>
      ))}
    </div>
  );
}

export default Tools;
