import { React, useRef } from "react";
import Grid from '@mui/material/Grid'
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import Flippy, { FrontSide, BackSide } from 'react-flippy';
import { makeStyles } from "@mui/styles";
import { NavLink } from "react-router-dom";
import { lightTheme, darkTheme } from './../theme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro'

const ShowCards = ({post}) => {
  const localTheme = window.localStorage.getItem('theme')
  const theme = localTheme === 'light' ? lightTheme : darkTheme;
  const useStyles = makeStyles(theme);
  const classes = useStyles();
  const mainPrimaryColor = theme.palette.primary1Color;

  const inputRef = useRef([]);

  return (
    <Grid item xs={10} sm={3} key={post.title}>
      <Card style={{ background: mainPrimaryColor }}>
        <Flippy
          flipOnClick={false}
          isFlipped={false}
          ref={el => inputRef.current[post.title] = el}
        >
          <FrontSide className={post.ready ? classes.cardActive : classes.cardDisabled}>
            {post.ready
              ? <NavLink to={post.link} className={classes.link}>
                  <CardMedia
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
                  {inputRef.current &&
                    <FontAwesomeIcon
                      style={{
                        position: 'absolute', left: '98%', top: '8%',
                        transform: 'translate(-100%, -50%)'
                      }}
                      className={classes.cardIcon}
                      icon={solid('circle-info')}
                      title={"Show info"}
                      size="2x"
                    />
                  }
                </div>
              :
                <div 
                  style={{
                    position: 'absolute', left: '98%', top: '8%',
                    transform: 'translate(-100%, -50%)'
                  }}
                  onClick={() => inputRef.current[post.title].preventDefault() }
                >
                  <FontAwesomeIcon
                    className={classes.cardIcon}
                    icon={solid('triangle-exclamation')}
                    title="On the backlog..."
                    size="2x"
                  />
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
                <FontAwesomeIcon
                  style={{
                    position: 'absolute', left: '98%', top: '8%',
                    transform: 'translate(-100%, -50%)'
                  }}
                  className={classes.cardIcon}
                  icon={solid('circle-arrow-left')}
                  size="2x"
                />
              </div>
            </BackSide>
          }
        </Flippy>
        <NavLink to={post.link} className={classes.link}>
          <div className={classes.cardTitle}>
            {post.title}
          </div>
        </NavLink>
      </Card>
    </Grid>
  )
}

export default ShowCards;
