var clapDetector = require('clap-detector');
var komponist = require('komponist');
var exec = require('child_process').exec;

var mpdConfig = require('./mpd.json');
var clapConfig = require('./clap.json');

// Start clap detection
clapDetector.start(clapConfig);

console.log('Notta Klapajaa started');

clapDetector.onClaps(clapConfig.CLAPS, clapConfig.TIMEOUT, function(delay) {
   komponist.createConnection(mpdConfig.port, mpdConfig.host, function(err, client) {
       client.password(mpdConfig.pass);
       client.toggle();
       console.log("Pause toggled");
   });
});
