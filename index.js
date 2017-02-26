var clapDetector = require('clap-detector');
var komponist = require('komponist');

var mpdConfig = require('./config/mpd.json');
var clapConfig = require('./config/clap.json');

// Start clap detection
clapDetector.start(clapConfig);

console.log('Notta Klapajaa started');

var client = komponist.createConnection(mpdConfig.port, mpdConfig.server, function() {
   client.password(mpdConfig.pass, function(err) {
       clapDetector.onClaps(clapConfig.CLAPS, clapConfig.TIMEOUT, function(delay) {
           client.toggle();
           console.log('Pause toggled');
       });
   });
});
