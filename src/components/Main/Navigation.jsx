// Copyright (c) 2022 Carlos Peña-Monferrer. All rights reserved.
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

import { useEffect, useState } from "react";
import AppBar from "@mui/material/AppBar";
import { makeStyles } from "@mui/styles";
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import {
  Link,
  useLocation,
  useNavigate,
  useParams
} from "react-router-dom";
import LightModeIcon from '@mui/icons-material/WbSunny';
import DarkModeIcon from '@mui/icons-material/Brightness2';
import { ThemeProvider } from 'styled-components';
import { lightTheme, darkTheme, navTheme } from './../theme';
import { useDarkMode } from './useDarkMode';
import logoLight from "./logoLight.svg";
import logoDark from "./logoDark.svg";
import {isMobile} from 'react-device-detect';
import { NavLink } from "react-router-dom";

// TODO: fix
function withRouter(Component) {
  function ComponentWithRouterProp(props) {
    let location = useLocation();
    let navigate = useNavigate();
    let params = useParams();
    return (
      <Component
        {...props}
        router={{ location, navigate, params }}
      />
    );
  }

  return ComponentWithRouterProp;
}

function Navigation(element) {
  const useStyles =  makeStyles(navTheme);
  const classes = useStyles();
  const [theme, toggleTheme] = useDarkMode();
  const [show, setShow] = useState(true);
  const theme2 = window.localStorage.getItem('theme') || 'light'
  const themeMode = theme2 === 'light' ? lightTheme : darkTheme;
  const icon = theme2 === 'light' ? <DarkModeIcon /> : <LightModeIcon />;
  const logo = theme2 === 'light' ? logoLight : logoDark;
  const titleLight = 'Lights off';
  const titleDark = 'Lights on';
  const iconTitle = theme2 === 'light' ? titleLight : titleDark; 
  const mainSecondaryColor = themeMode.palette.primary2Color;
  const controlToolbar = () => {
    if (window.scrollY > 100) {
      setShow(false)
    }
    else
    {
      setShow(true)
    }
  }

  useEffect(() => {
    window.addEventListener('scroll', controlToolbar)
    return () => {
      window.removeEventListener('scroll', controlToolbar)
    }
  }, [])

  const location = useLocation();
  var location_path = location.pathname;

  if (location.pathname.match('/.*/$')) {
    location_path = location_path.slice(0, -1);
  }

  const split = location_path.split("/");
  var title = [];
  var link = [];

  for (let i = 1; i < split.length; i++) {
    link += "/" + split[i];
    if (!isMobile) {
      title.push(<Link to={link} key={i} style={{ color:mainSecondaryColor, textDecoration: 'none', fontFamily: 'monospace', fontSize: 15}}>/{split[i]}</Link>);
    }
  }

  return (
    <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
    <div className={classes.root}>
      {show &&
        <AppBar position="fixed">
          <Toolbar style={{ background: themeMode.appBar.background, minHeight: themeMode.appBar.minHeight, height: themeMode.appBar.height }}>
            <Link to="/">
	      <img alt="cfd.xyz" src={logo} className={classes.logo} />
            </Link>
            <Typography style={{ paddingTop: 1, flexGrow: 1, fontWeight: 550, color: mainSecondaryColor}}>
              { title }
	    </Typography>
            <div className={classes.root}>
              <NavLink to="/About" style={{ paddingTop: 1, paddingRight: 0, flexGrow: 1, fontWeight: 550, color: mainSecondaryColor, textDecoration: 'none', fontFamily: 'monospace', fontSize: 15}}>
                <div className={classes.link} color="inherit">
                  {"About"}
                </div>
              </NavLink>
            </div>
            <IconButton
              edge={false}
              style={{ border: "none", outline: "none", color: mainSecondaryColor }}
              aria-label="mode"
              title={iconTitle}
              onClick={() => toggleTheme(theme)}
            >
              {icon}
            </IconButton>
          </Toolbar>
        </AppBar>
      }
    <Toolbar style={{ background: themeMode.appBar.background, minHeight: themeMode.appBar.minHeight, height: themeMode.appBar.height}} />
    </div>
    </ThemeProvider>
  );
}

export default withRouter(Navigation);
