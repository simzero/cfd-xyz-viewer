// Copyright (c) 2022 Carlos Peña-Monferrer. All rights reserved.
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

import { useContext, useState } from 'react';
import { ThemeContext } from "../../App.js";

export const useDarkMode = () => {
  const {setName} = useContext(ThemeContext);
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
