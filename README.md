# klapajaa
_”Vois päästää notta klapajaa mut ku ei oo lörpöä niin ei aski tohaja”_

Control your Music Player Daemon with clapping your hands.

This is rather simple integration with clap-detector and komponist node modules. First one detects the clap and later one sends command to your MPD instance.

### Installation
* `npm install`
* Configure the clap.json and mpd.json and off you go.
* For MacOS: `brew cask install sox`
* If you wish to control Onkyo amplifier: `pip install onkyo-eiscp`

### Running
* `node start.js`

### clap.json

See also: https://www.npmjs.com/package/clap-detector#configuration

* `CLAPS` - How many claps are needed for the command
* `TIMEOUT` - How many milliseconds is allowed between claps
* `AUDIO_SOURCE` - Usually `alsa hw:0,0` in Linux and `coreaudio default` in MacOS. No idea about OSS/Pulseaudio support, it is actually up to clap-detector module.
* `DETECTION_PERCENTAGE_START/END` - Minimum noise percentage threshold necessary to start/end recording sound
* `CLAP_AMPLITUDE_THRESHOLD` - Minimum amplitude threshold to be considered as clap.
* `CLAP_ENERGY_THRESHOLD` - Maximum energy threshold to be considered as clap.
* `MAX_HISTORY_LENGTH` - For clap-detector internal use, how many claps are saved in history. Not used in this script.
