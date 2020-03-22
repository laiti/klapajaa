/* eslint-disable no-console */
import ClapDetector from 'clap-detector';

const komponist = require('komponist');

const { exec } = require('child_process');

const mpdConfig = require('./config/mpd.json');
const clapConfig = require('./config/clap.json');

const clap = new ClapDetector(clapConfig);

console.log(`${new Date().toISOString()}: Notta Klapajaa started. Clap ${clapConfig.CLAPS} times in ${clapConfig.TIMEOUT} milliseconds to toggle pause.`);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function for printing client status to console
function printClientStatusToLog(client) {
  client.status((_statusErr, status) => {
    if (status.state === 'play') {
      client.currentsong((_currentErr, info) => {
        console.log(`${new Date().toISOString()}: Status: Playing: ${info.Artist} - ${info.Title}`);
      });
    } else {
      console.log(`${new Date().toISOString()}: Status: ${status.state}`);
    }
  });
  return client.state;
}

// Main function
komponist.createConnection(mpdConfig.port, mpdConfig.server, (createErr, client) => {
  if (createErr) {
    console.log(`${new Date().toISOString()} : Connection failure: cannot connect to ${mpdConfig.server}:${mpdConfig.port}. Is mpd running, accessible and configured properly in config/mpd.json?`);
    process.exit();
  }

  client.password(mpdConfig.pass, (passErr) => {
    if (passErr) {
      console.log(`${new Date().toISOString()}: Connection failure: cannot login to ${mpdConfig.server}:${mpdConfig.port}. Wrong credentials, check config/mpd.json.`);
      process.exit();
    }

    console.log(`${new Date().toISOString()}: Logged in succesfully to MPD instance at ${mpdConfig.server}:${mpdConfig.port}`);
    printClientStatusToLog(client);

    let justToggle = true;
    if (!mpdConfig.onkyoCmd) {
      console.log(`${new Date().toISOString()}: Onkyo not configured`);
    } else {
      console.log(`${new Date().toISOString()}: Onkyo configuration found`);
      justToggle = false;
    }

    clap.addClapsListener(() => {
      // If Onkyo is not configured, we just toggle play-pause
      if (justToggle) {
        client.toggle();
        // The change to playback state we did above isn't active immediately
        sleep(200).then(() => {
          printClientStatusToLog(client);
        });
      } else {
        // If onkyo is on and in correct input already, we want to toggle playpause
        let mpdToggle = true;
        let toggleWait = 0;

        // Query Onkyo power state
        exec(`${mpdConfig.onkyoCmd} power=query`, (_powerError, powerState) => {
          if (powerState && powerState.includes(': system-power = on')) {
            console.log(`${new Date().toISOString()}: Onkyo is already on`);
          } else {
            console.log(`${new Date().toISOString()}: Onkyo is off, turning on`);
            // If power was off, we do not want to toggle playpause. We want the playback to start
            // but with a delay so that Onkyo is already powered up when we start.
            mpdToggle = false;
            toggleWait = 6000;
            exec(`${mpdConfig.onkyoCmd} system-power=on`);
          }

          // Query current input of Onkyo
          exec(`${mpdConfig.onkyoCmd} input-selector=query`, (_inputError, currentInput) => {
            if (currentInput && currentInput.includes(`: input-selector = ${mpdConfig.onkyoInput}`)) {
              console.log(`${new Date().toISOString()}: Onkyo input is already set to ${mpdConfig.onkyoInput}`);
            } else {
              console.log(`${new Date().toISOString()}: Changing Onkyo input to ${mpdConfig.onkyoInput} and setting volume to ${mpdconfig.onkyoVolume}`);
              // If input was wrong, we do not want to toggle playpause but the playback to start
              // without delay.
              mpdToggle = false;
              exec(`${mpdConfig.onkyoCmd} input-selector=${mpdConfig.onkyoInput}`);
              exec(`${mpdConfig.onkyoCmd} input-volume=${mpdConfig.onkyoVolume}`);
            }

            // Wait for Onkyo to power on if it was off
            if (toggleWait > 0) {
              console.log(`${new Date().toISOString()}: Waiting Onkyo to power on`);
            }

            // Decide if we want to start play or toggle playpause
            sleep(toggleWait).then(() => {
              if (mpdToggle) {
                console.log(`${new Date().toISOString()}: Toggling playpause`);
                client.toggle();
              } else {
                console.log(`${new Date().toISOString()}: Starting playback`);
                client.play();
              }

              // The change to playback state we did above isn't active immediately
              sleep(200).then(() => {
                printClientStatusToLog(client);
              });
            });
          });
        });
      }
    }, { number: clapConfig.CLAPS, delay: clapConfig.TIMEOUT });
  });
});
