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
  const theme2 = window.localStorage.getItem('theme') || 'light'
  const themeMode = theme2 === 'light' ? lightTheme : darkTheme;
  const icon = theme2 === 'light' ? <DarkModeIcon /> : <LightModeIcon />;
  const logo = theme2 === 'light' ? logoLight : logoDark;
  const titleLight = 'Lights off';
  const titleDark = 'Lights on';
  const iconTitle = theme2 === 'light' ? titleLight : titleDark; 
  const mainSecondaryColor = themeMode.palette.primary2Color;

  const location = useLocation();
  const location_path = location.pathname;
  const split = location_path.split("/");
  var title = [];
  var link = "/";
  for (let i = 1; i < split.length; i++) {
     if (i < split.length - 1) {
	  link += split[i] + "/";
          title.push(<Link to={link} key={i} style={{ color:mainSecondaryColor, textDecoration: 'none', fontFamily: 'monospace', fontSize: 15}}>/{split[i]}</Link>);
     }
     else
          title.push(<Link to="#" key={i} style={{ color:mainSecondaryColor, textDecoration: 'none', fontFamily: 'monospace', fontSize: 15}}>/{split[i]}</Link>);
  }

  return (
    <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
    <div>
      <AppBar position="fixed">
         <Toolbar style={{ background: themeMode.appBar.background, minHeight: themeMode.appBar.minHeight, height: themeMode.appBar.height}}>
            <Link to="/">
	        <img alt="cfd.xyz" src={logo} className={classes.logo} />
            </Link>
            <Typography style={{ flexGrow: 1, fontWeight: 550, color: mainSecondaryColor}}>
                { title }
	    </Typography>
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
    <Toolbar style={{ background: themeMode.appBar.background, minHeight: themeMode.appBar.minHeight, height: themeMode.appBar.height}} />
    </div>
    </ThemeProvider>
  );
}

export default withRouter(Navigation);
