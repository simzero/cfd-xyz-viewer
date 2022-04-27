import React, { useState, useEffect } from 'react'
import { makeStyles } from '@mui/styles';
import Linkify from 'linkify-react';
import { global } from '../theme';

const Fader = ({ text }) => {
  const useStyles = makeStyles(global);
  const classes = useStyles();

  const [fade, setFade] = useState(true);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const timeout = setInterval(() => {
      if (fade)
      {
        setFade(false)
      }
      else
      {
        setFade(true)
      }
      if (counter < text.length - 1)
      {
        setCounter(counter+1)
      }
      else
      {
        setCounter(0)
      }
    }, 9000);
    return () => clearInterval(timeout)
  }, [fade])

  return (
    <div className={fade ? classes.fadeIn : classes.fadeOut} style={{fontStyle: 'italic'}}>
      <Linkify
        options={{
          attributes:
            { },
            target: "_blank"
        }}
      >
        {text[counter]}
      </Linkify>
    </div>
  )
}

export default Fader
