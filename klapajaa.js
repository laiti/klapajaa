import ClapDetector from 'clap-detector';
const komponist = require('komponist');

const mpdConfig = require('./config/mpd.json');
const clapConfig = require('./config/clap.json');

const clap = new ClapDetector(clapConfig);

const { exec } = require('child_process');

console.log(new Date().toISOString() + ': Notta Klapajaa started. Clap ' + clapConfig.CLAPS + ' times in ' + clapConfig.TIMEOUT + ' milliseconds to toggle pause.');


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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

            // Decide between toggle and play from Onkyo state
            let toggleWait = 0;
            let mpdToggle = true;

            exec(`${mpdConfig.onkyoCmd} power=query`, (error, powerState, powerStderr) => {
                if (powerState && powerState.includes(': system-power = on')) {
                    console.log(new Date().toISOString() + ': Onkyo is already on');
                } else {
                    console.log(new Date().toISOString() + ': Onkyo is off, turning on');
                    mpdToggle = false;
                    toggleWait = 3000;
                    exec(`${mpdConfig.onkyoCmd} system-power=on`);
                }

                exec(`${mpdConfig.onkyoCmd} input-selector=query`, (error, currentInput, inputStderr) => {
                    if (currentInput && currentInput.includes(`: input-selector = ${mpdConfig.onkyoInput}`)) {
                        console.log(new Date().toISOString() + ': Onkyo input is already set to ' + mpdConfig.onkyoInput);
                    } else {
                        console.log(new Date().toISOString() + ': Changing Onkyo input to ' + mpdConfig.onkyoInput);
                        mpdToggle = false;
                        exec(`${mpdConfig.onkyoCmd} input-selector=${mpdConfig.onkyoInput}`);
                    }

                    // Wait for amp to power on
                    if (mpdToggle) {
                        console.log(new Date().toISOString() + ': Onkyo was on and input was set to ' + mpdConfig.onkyoInput + ', toggling playpause');
                        client.toggle();
                    } else {
                        console.log(new Date().toISOString() + ': Onkyo was off or in wrong input, waiting it to power on and starting play');
                        sleep(toggleWait).then(() => {
                            client.play();
                        });
                    }
                    // mpd status does not change immediately after the command
                    sleep(200).then(() => {
                      printClientStatusToLog(client);
                      console.log('');
                    });
                });
            });

        }, { number: clapConfig.CLAPS, delay: clapConfig.TIMEOUT });
    });
});
