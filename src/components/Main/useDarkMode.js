import { useContext, useState } from 'react';
import { ThemeContext } from "../../App.js";

export const useDarkMode = () => {
  const {name, setName} = useContext(ThemeContext);
  const [theme, setTheme] = useState("light");
  const setMode = mode => {
    window.localStorage.setItem('theme', mode)
    setTheme(mode)
  };

  const switchTheme = () => {
    theme === 'light' ? setMode('dark') : setMode('light')
    setName(theme)
  };

  return [theme, switchTheme]
};
