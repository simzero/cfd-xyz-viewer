import { makeStyles } from "@mui/styles";
import { lightTheme, darkTheme } from './components/theme';
import { React, useState, useEffect, createContext } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import {
   Navigation,
   Footer,
   Home,
   OpenFOAM,
   Incompressible,
   SimpleFoam,
   PitzDaily,
   Tools,
   Steady,
} from "./components";

export const ThemeContext = createContext({
  name: "light",
  setName: () => {}
});

function App() {

  useEffect(() => {
   document.title = "cfd.xyz | Home"
  }, []);

  const themeType = window.localStorage.getItem('theme')
  const theme = themeType === 'light' ? lightTheme : darkTheme;
  const useStyles =  makeStyles(theme);
  const classes = useStyles();
  const [name, setName] = useState(null);
  const value = {name, setName};

  return (
    <div>
      <Router>
        <div className={classes.mainWrapper}>
          <ThemeContext.Provider value={value}>
            <Navigation />
            <Routes>
              <Route path="/" exact element={<Home />} />
              <Route path="/OpenFOAM" exact element={<OpenFOAM />} />
              <Route path="/OpenFOAM/incompressible" exact element={<Incompressible />} />
              <Route path="/OpenFOAM/incompressible/simpleFoam" exact element={<SimpleFoam />} />
              <Route path="/OpenFOAM/incompressible/simpleFoam/PitzDaily" exact element={<PitzDaily />} />
              <Route path="/Tools" exact element={<Tools />} />
              <Route path="/Tools/ITHACA-FV_Steady" exact element={<Steady />} />
            </Routes>
            <Footer />
          </ThemeContext.Provider>
        </div>
      </Router>
    </div>
  );
}

export default App;
