import ClapDetector from 'clap-detector';
const komponist = require('komponist');

const mpdConfig = require('./config/mpd.json');
const clapConfig = require('./config/clap.json');

const clap = new ClapDetector(clapConfig);


console.log('Notta Klapajaa started. Clap ' + clapConfig.CLAPS + ' times in ' + clapConfig.TIMEOUT + ' milliseconds to toggle pause.');

// Start clap detection
komponist.createConnection(mpdConfig.port, mpdConfig.server, function(err, client) {
    if(err) {
        console.log('Connection failure: cannot connect to ' + mpdConfig.server + ':' + mpdConfig.port + '. Is mpd running, accessible and configured properly in config/mpd.json?')
        process.exit()
    }
    console.log('Connected to MPD instance ' + mpdConfig.server + ':' + mpdConfig.port);

    client.password(mpdConfig.pass, function(err) {
        if(err) {
            console.log('Connection failure: cannot login to ' + mpdConfig.server + ':' + mpdConfig.port + '. Wrong credentials, check config/mpd.json.')
            process.exit()
        }
        console.log('Logged in.')

        const disposableTwoClapsListener = clap.addClapsListener(claps => {
            client.toggle();

            client.status(function(err, status) {
                console.log('')
                console.log(new Date().toISOString() + ': Pause toggled, current status:', status.state);
                if(status.state === "play") {
                    client.currentsong(function(err, info) {
                        console.log(new Date().toISOString() + ': Playing: ' + info.Artist + ' - ' + info.Title + '.')
                    });
                }
            });
        }, { number: clapConfig.CLAPS, delay: clapConfig.TIMEOUT });
    });
});
