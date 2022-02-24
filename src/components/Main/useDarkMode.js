import { useContext, useState } from 'react';
import { ThemeContext } from "../../App.js";

export const useDarkMode = () => {
  const {name, setName} = useContext(ThemeContext);
  const [theme, setTheme] = useState(window.localStorage.getItem('theme'));
  const setMode = mode => {
    window.localStorage.setItem('theme', mode)
    setTheme(mode)
    setName(theme)
  };

  const switchTheme = () => {
    theme === 'light' ? setMode('dark') : setMode('light')
  };

  return [theme, switchTheme]
};
