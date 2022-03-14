// Copyright (c) 2022 Carlos Peña-Monferrer. All rights reserved.
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

import { React, useRef } from "react";
import { useSwipeable } from 'react-swipeable';
import Grid from '@mui/material/Grid'
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import Flippy, { FrontSide, BackSide } from 'react-flippy';
import { makeStyles } from "@mui/styles";
import { NavLink } from "react-router-dom";
import { lightTheme, darkTheme } from './../theme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro'
import SwipeIcon from '@mui/icons-material/Swipe';
import {isMobile} from 'react-device-detect';
import Box from '@mui/material/Box';
import { createTheme } from '@mui/material/styles';

const ShowCards = ({post}) => {
  const localTheme = window.localStorage.getItem('theme') || "light"
  let theme = localTheme === 'light' ? lightTheme : darkTheme;
  const useStyles = makeStyles(theme);
  const classes = useStyles();
  const mainPrimaryColor = theme.palette.primary1Color;

  const inputRef = useRef([]);
  //theme = responsiveFontSizes(theme);
	//
const theme2 = createTheme();
//	theme2 = responsiveFontSizes(theme2);
theme2.typography.h6 = {
  fontSize: '0.1rem',
  '@media (min-width:300px)': {
    fontSize: '0.6rem',
  },
  [theme2.breakpoints.up('md')]: {
    fontSize: '0.3rem',
  },
};

  const handlers = useSwipeable({
    onSwipedLeft: () => inputRef.current[post.title].toggle(),
    onSwipedRight: () => inputRef.current[post.title].toggle(),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

function ShowBody() {
  return (
        <Flippy
          flipOnClick={false}
          isFlipped={false}
          ref={el => inputRef.current[post.title] = el}
        >
          <FrontSide className={post.ready ? classes.cardActive : classes.cardDisabled}>
            {post.ready
              ? <NavLink to={post.link} className={classes.link}>
                  <CardMedia
		    className={classes.cardMedia}
                    component="img"
                    image={post.image + '.png'}
                    title={post.title}
                  />
                </NavLink>
              :
                  <CardMedia
                    component="img"
                    image={post.image + '.png'}
                    title={post.title}
                  />
            }
            {post.ready
              ? <div
                  onClick={() => inputRef.current[post.title].toggle() }
                >
                  {(inputRef.current && !isMobile ) &&
                    <FontAwesomeIcon
                      style={{
                        position: 'absolute', left: '96%', top: '8%',
                        transform: 'translate(-100%, -50%)'
                      }}
                      className={classes.cardIcon}
                      icon={solid('circle-info')}
                      title={"Show info"}
                    />
                  }
                  {(inputRef.current && isMobile) &&
		    <SwipeIcon 
                      style={{
                        position: 'absolute', left: '96%', top: '12%',
                        transform: 'translate(-100%, -50%)'
                      }}
                      className={classes.cardIcon}
                    />
                  }
                </div>
              :
                <div 
                  style={{
                    position: 'absolute', left: '96%', top: '8%',
                    transform: 'translate(-100%, -50%)'
                  }}
                  onClick={() => inputRef.current[post.title].preventDefault() }
                >
	        {(!isMobile) &&
                  <FontAwesomeIcon
                    className={classes.cardIcon}
                    icon={solid('triangle-exclamation')}
                    title="On the backlog..."
                  />
		}
                </div>
            }
          </FrontSide>
          {post.ready &&
            <BackSide className={post.ready ? classes.cardActive : classes.cardDisabled}>
              {post.ready
                ? <NavLink to={post.link} className={classes.link}>
                    <div className={classes.cardDescription} >
                      {post.description}
                    </div>
                  </NavLink>
                : <NavLink to={post.link} onClick={e => e.preventDefault()}>
                    <div className={classes.cardDescription} >
                      {post.description}
                    </div>
                  </NavLink>
              }
              <div 
                onClick={() => inputRef.current[post.title].toggle() }
              >
	        {(!isMobile) &&
                <FontAwesomeIcon
                  style={{
                    position: 'absolute', left: '96%', top: '8%',
                    transform: 'translate(-100%, -50%)'
                  }}
                  className={classes.cardIcon}
                  icon={solid('circle-arrow-left')}
                />
                }
              </div>
            </BackSide>
          }
        </Flippy>
  );
}


  return (
    <Grid item xs={12} sm={4} md={4} lg={8} xl={8} key={post.title}>
      <Card className={classes.cardMedia} style={{ background: mainPrimaryColor }}>
        {post.ready
          ? <div {...handlers}>
	      <ShowBody/>
            </div>
          : <div>
	      <ShowBody/>
            </div>
	}
        {post.ready
          ? <NavLink to={post.link} className={classes.link}>
              <div className={classes.cardTitle}>
	        {post.title}
              </div>
            </NavLink>
          : <div className={classes.link}>
	      <Box className={classes.cardTitle}>
	        {post.title}
              </Box>
            </div>
	}
      </Card>
    </Grid>
  )
}

export default ShowCards;
