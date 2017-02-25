var clapDetector = require('clap-detector');
var komponist = require('komponist');

var mpdConfig = require('./config/mpd.json');
var clapConfig = require('./config//clap.json');

// Start clap detection
clapDetector.start(clapConfig);

console.log('Notta Klapajaa started');

clapDetector.onClaps(clapConfig.CLAPS, clapConfig.TIMEOUT, function(delay) {
   komponist.createConnection(mpdConfig.port, mpdConfig.server, function(err, client) {
       client.password(mpdConfig.pass);
       client.toggle();
       console.log("Pause toggled");
   });
});
