let clapDetector = require('clap-detector');
let komponist = require('komponist');

let mpdConfig = require('./config/mpd.json');
let clapConfig = require('./config/clap.json');

// Start clap detection
clapDetector.start(clapConfig);

console.log('Notta Klapajaa started. Clap ' + clapConfig.CLAPS + ' times in ' + clapConfig.TIMEOUT + ' milliseconds to toggle pause.');

komponist.createConnection(mpdConfig.port, mpdConfig.server, function(err, client) {

    if(err) {
        console.log('Connection failure: cannot connect to ' + mpdConfig.server + ':' + mpdConfig.port + '. Is mpd running, accessible and configured properly in config/mpd.json?')
        process.exit()
    }

    client.password(mpdConfig.pass, function(err) {
        if(err) {
            console.log('Connection failure: cannot login to ' + mpdConfig.server + ':' + mpdConfig.port + '. Wrong credentials, check config/mpd.json.')
            process.exit()
        }

        clapDetector.onClaps(clapConfig.CLAPS, clapConfig.TIMEOUT, function(delay) {
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
        });
    });
});
