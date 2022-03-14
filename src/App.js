import { makeStyles } from "@mui/styles";
import { lightTheme, darkTheme } from './components/theme';
import { React, useState, useEffect, createContext } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import MetaTags from 'react-meta-tags';
import {
   Navigation,
   Footer,
   Home,
   OpenFOAM,
   Incompressible,
   SimpleFoam,
   PitzDaily,
//    MixerVessel2D,
//    MotorBike,
//    TurbineSiting,
//    WindAroundBuildings,
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

  const themeType = window.localStorage.getItem('theme') || "light"
  const theme = themeType === 'light' ? lightTheme : darkTheme;
  const useStyles =  makeStyles(theme);
  const classes = useStyles();
  const [name, setName] = useState(null);
  const value = {name, setName};

  return (
    <div>
      <MetaTags>
        <title>cfd.xyz</title>
        <meta name="description" content="An open-source web platform for data-driven generation and visualization of CFD data." />
        <meta property="og:description" content="An open-source web platform for data-driven generation and visualization of CFD data." />
        <meta property="og:title" content="cfd.xyz" />
        <meta property="og:image" content="images/card.png" />
        <meta property="og:url" content="http://www.cfd.xyz" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="cfd.xyz" />
        <meta property="twitter:url" content="http://www.cfd.xyz" />
        <meta name="twitter:title" content="cfd.xyz" />
        <meta name="twitter:description" content="An open-source web platform for data-driven generation and visualization of CFD data." />
        <meta name="twitter:image" content="images/card.png" />
      </MetaTags>
      <Router>
        <div className={classes.mainWrapper}>
          <ThemeContext.Provider value={value}>
            <Navigation />
            <Routes>
              <Route path="/" exact element={<Home />} />
              <Route path="/OF" exact element={<OpenFOAM />} />
              <Route path="/OF/incompressible" exact element={<Incompressible />} />
              <Route path="/OF/incompressible/simpleFoam" exact element={<SimpleFoam />} />
              <Route path="/OF/incompressible/simpleFoam/PitzDaily" exact element={<PitzDaily />} />
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
