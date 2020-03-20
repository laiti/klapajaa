import ClapDetector from 'clap-detector';
const komponist = require('komponist');

const mpdConfig = require('./config/mpd.json');
const clapConfig = require('./config/clap.json');

const clap = new ClapDetector(clapConfig);

const util = require('util');
const exec = util.promisify(require('child_process').exec);


console.log(new Date().toISOString() + ': Notta Klapajaa started. Clap ' + clapConfig.CLAPS + ' times in ' + clapConfig.TIMEOUT + ' milliseconds to toggle pause.');

// Function for printing client status to console
function printClientStatusToLog(client) {

    client.status(function(err, status) {

        if(status.state === "play") {
            client.currentsong(function(err, info) {
                console.log(new Date().toISOString() + ': Status: Playing: ' + info.Artist + ' - ' + info.Title + '.')
            });
        } else {
            console.log(new Date().toISOString() + ': Status:', status.state);
        }
    });
    return client.state;
}


// Main function
komponist.createConnection(mpdConfig.port, mpdConfig.server, function(err, client) {

    if(err) {
        console.log(new Date().toISOString() + ': Connection failure: cannot connect to ' + mpdConfig.server + ':' + mpdConfig.port + '. Is mpd running, accessible and configured properly in config/mpd.json?')
        process.exit()
    }

    client.password(mpdConfig.pass, function(err) {
        if(err) {
            console.log(new Date().toISOString() + ': Connection failure: cannot login to ' + mpdConfig.server + ':' + mpdConfig.port + '. Wrong credentials, check config/mpd.json.')
            process.exit()
        }
        console.log(new Date().toISOString() + ': Logged in succesfully to MPD instance at ' + mpdConfig.server + ':' + mpdConfig.port);
        printClientStatusToLog(client);

        const disposableTwoClapsListener = clap.addClapsListener(claps => {

            let originallyPowerOn = false;
            const { powerState, powerStderr } = await exec(`${mpdConfig.onkyoCmd} power=query`);
            if (powerState && powerState.includes(': system-power = on')) {
                console.log(new Date().toISOString() + ': Onkyo is already on: '+ powerstate);
                originallyPowerOn = true;
            } else {
                console.log(new Date().toISOString() + ': Onkyo is off, turning on');
                exec(`${mpdConfig.onkyoCmd} system-power=on`)
            }

            const { currentInput, inputStderr } = exec(`${mpdConfig.onkyoCmd} input-selector=query`);
            if (currentInput && currentInput.includes(`: input-selector = ${mpdConfig.onkyoInput}`)) {
                console.log(new Date().toISOString() + ': Onkyo input is already set to ' + mpdConfig.onkyoInput);
            } else {
                console.log(new Date().toISOString() + ': Setting Onkyo to + ' + mpdConfig.onkyoInput);
                exec(`${mpdConfig.onkyoCmd} input-selector=${mpdConfig.onkyoInput}`);
            }

            // Wait for amp to power on
            if (originallyPowerOn) {
              console.log(new Date().toISOString() + ': Onkyo was on, toggling playpause');
              client.toggle();
            } else {
              console.log(new Date().toISOString() + ': Onkyo was off, waiting it to power on and starting play');
              setTimeout(client.play, 3000);
            }

            console.log('');
            console.log(new Date().toISOString() + ': Claps detected, pause toggled.');
            printClientStatusToLog(client);

        }, { number: clapConfig.CLAPS, delay: clapConfig.TIMEOUT });
    });
});
