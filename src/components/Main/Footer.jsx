// Copyright (c) 2022 Carlos Peña-Monferrer. All rights reserved.
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

import React from "react";
import { makeStyles } from "@mui/styles";
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { lightTheme, darkTheme } from './../theme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { solid, brands } from '@fortawesome/fontawesome-svg-core/import.macro'

function Footer() {
  const themeType = window.localStorage.getItem('theme') || "light"

  //const localTheme = window.localStorage.getItem('theme');
  const theme = themeType === 'light' ? lightTheme : darkTheme;
  const mainPrimaryColor = theme.palette.primary1Color;
  const mainSecondaryColor = theme.palette.primary2Color;
  const useStyles =  makeStyles(theme);
  const classes = useStyles();

  function Copyright() {
    return (
      <div>
        <Typography
          style={{
            fontFamily: 'monospace',
            fontSize: 12,
            fontWeight: 600
          }}
        >
          {'© '}
          {new Date().getFullYear()}
          {' '}
          {'SIMZERO'}
          <Link
            className={classes.link}
            color="inherit"
            href="https://www.companyname.com"
            target="_blank"
          >
          </Link>
        </Typography>
      </div>
    );
  }

  //<div style={{position: "fixed", left: 0, bottom: 0, right: 0}}>
  return (
    <div>
      <div style={{position: "absolute", left: 0, bottom: 0, right: 0}}>
        <footer style={{ padding: '0px', bottom: '0', position: 'relative', height: '50px', width: '100%', backgroundColor: mainPrimaryColor, color: mainSecondaryColor }}>
          <div style={{marginTop: 8, padding: 10, justifyContent: 'center', alignItems: 'center', flexDirection: "column", display: 'inline-block', float: 'left'}}>
            <Copyright />
          </div>
          <div style={{alignSelf: 'flex-end', position: 'absolute', marginTop: 4, right: 8}}>
            <div style={{alignSelf: 'flex-end', position: 'absolute', right: 5, padding: 10, margin: '0', width: '15%', display: 'table'}}>
              <div style={{ display: 'table-row'}}>
                <div style={{width: '600px', display: 'table-cell', paddingLeft: 0}}>
                  <Typography
                    variant="body2"
                    align="center"
                  >
                    <a className={classes.link} target="_blank" href="https://join.slack.com/t/cfd-xyz/shared_invite/zt-15qjacmzo-1woWqeklQ0IeXZb_F6ueaQ">
                      <FontAwesomeIcon title="Engage (Slack)" style={{ align: 'center', color:mainPrimaryColor,background: mainSecondaryColor, width: '24px', height: '24px', display: 'inline-block'}} icon={brands('slack')} />
                    </a>
                  </Typography>
                </div>
                <div style={{align: 'center', width: '600px', display: 'table-cell', paddingLeft: 10}}>
                  <Typography
                    align="center"
                    style={{fontFamily: 'monospace', fontSize: 12}}
                  >
                    <a className={classes.link} target="_blank" href="https://github.com/simzero-oss/cfd-xyz">
                      <FontAwesomeIcon title="Contribute (GitHub)" style={{ width: '24px', height: '24px'}} icon={brands('github')} />
                    </a>
                  </Typography>
                </div>
                <div style={{flexGrow: '1',align: 'center', width: '600px', display: 'table-cell', paddingLeft: 10}}>
                  <Typography
                    align="center"
                    style={{fontFamily: 'monospace', fontSize: 12}}
                  >
                    <a className={classes.link} target="_blank" href="https://www.linkedin.com/sharing/share-offsite/?url=http://www.cfd.xyz">
                      <FontAwesomeIcon title="Share (LinkedIn)" style={{width: '24px', height: '24px'}} icon={brands('linkedin')} />
                    </a>
                  </Typography>
                </div>
                <div style={{align: 'center', width: '600px', display: 'table-cell', paddingLeft: 10}}>
                  <Typography
                    align="center"
                    style={{fontFamily: 'monospace', fontSize: 12}}
                  >
                    <a className={classes.link} target="_blank" href="https://www.paypal.com/donate/?hosted_button_id=KKB4LH96E59A4">
                      <FontAwesomeIcon title="Donate (PayPal)" style={{ width: '24px', height: '24px'}} icon={solid('piggy-bank')} />
                    </a>
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Footer;
