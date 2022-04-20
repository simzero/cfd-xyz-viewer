// Copyright (c) 2022 Carlos Peña-Monferrer. All rights reserved.
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

import { useEffect, useState } from "react";
import AppBar from "@mui/material/AppBar";
import { makeStyles } from "@mui/styles";
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import {
  Link,
  useLocation,
  useNavigate,
  useParams
} from "react-router-dom";
import LightModeIcon from '@mui/icons-material/WbSunny';
import DarkModeIcon from '@mui/icons-material/Brightness2';
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

  if ((location_path.length > 1) && (location_path != "/About")) {
    for (let i = 1; i < split.length; i++) {
      link += "/" + split[i];
      if (!isMobile) {
        title.push(<Link to={link} key={i} className={classes.links} style={{color: mainSecondaryColor}}>/{split[i]}</Link>);
      }
    }
  }

  return (
    <div className={classes.root}>
      {show &&
        <AppBar position="fixed">
          <Toolbar style={{ background: themeMode.appBar.background, minHeight: themeMode.appBar.minHeight, height: themeMode.appBar.height }}>
            <Link to="/">
	      <img alt="cfd.xyz" src={logo} className={classes.logo} />
            </Link>
            <div style={{paddingTop: 3, flexGrow: 1}}>
              { title }
	    </div>
            <div className={classes.root} style={{paddingTop: 3, paddingRight: 5}}>
              <NavLink to="/About" className={classes.links} style={{color: mainSecondaryColor}}>
                <div>
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
  );
}

export default withRouter(Navigation);
