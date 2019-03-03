import ClapDetector from 'clap-detector';

const komponist = require('komponist');

const mpdConfig = require('./config/mpd.json');
const clapConfig = require('./config/clap.json');

const clap = new ClapDetector(clapConfig);

console.log(`${new Date().toISOString()}: Notta Klapajaa started. Clap ${clapConfig.CLAPS} times in ${clapConfig.TIMEOUT} milliseconds to toggle pause.`);

// Function for printing client status to console
function printClientStatusToLog(client) {
  client.status((statuserr, status) => {
    if (status.state === 'play') {
      client.currentsong((songerr, info) => {
        console.log(`status: playing: ${info.Artist} - ${info.Title}`);
      });
    } else {
      console.log(`status: ${status.state}d`);
    }
  });
  return client.state;
}

// Main function
komponist.createConnection(mpdConfig.port, mpdConfig.server, (connectionErr, client) => {
  // TODO: catch all possible connectivity errors
  if (connectionErr) {
    console.log(`${new Date().toISOString()}: Connection failure: cannot connect to ${mpdConfig.server}:${mpdConfig.port}. Is mpd running, accessible and configured properly in config/mpd.json?`);
    process.exit();
  }

  client.password(mpdConfig.pass, (configErr) => {
    if (configErr) {
      console.log(`${new Date().toISOString()}: Connection failure: cannot login to ${mpdConfig.server}':'${mpdConfig.port}. Wrong credentials, check config/mpd.json.`);
      process.exit();
    }

    console.log(`${new Date().toISOString()}: Logged in succesfully to MPD instance at ${mpdConfig.server}:${mpdConfig.port}`);

    // No newline here, let printClientStatusToLog do that
    process.stdout.write(`${new Date().toISOString()}: Startup successful. Current `);
    printClientStatusToLog(client);

    clap.addClapsListener(() => {
      client.toggle();
      // No newline here, let printClientStatusToLog do that.
      process.stdout.write(`${new Date().toISOString()}: Claps detected. New `);
      printClientStatusToLog(client);
    }, { number: clapConfig.CLAPS, delay: clapConfig.TIMEOUT });
  });
});
