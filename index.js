let clapDetector = require('clap-detector');
let komponist = require('komponist');

let mpdConfig = require('./config/mpd.json');
let clapConfig = require('./config/clap.json');

// Start clap detection
clapDetector.start(clapConfig);

console.log('Notta Klapajaa started. Clap ' + clapConfig.CLAPS + ' times in ' + clapConfig.TIMEOUT + ' milliseconds to toggle pause.');
console.log('')

let client = komponist.createConnection(mpdConfig.port, mpdConfig.server, function() {
   client.password(mpdConfig.pass, function(err) {
       clapDetector.onClaps(clapConfig.CLAPS, clapConfig.TIMEOUT, function(delay) {
           client.toggle();
           console.log(new Date().toISOString() + ': pause toggled');
       });
   });
});
