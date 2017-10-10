var path = require('path');

module.exports = function loadScripts (robot) {
  var scriptsPath = path.resolve(__dirname, 'src/scripts');
  return [
    robot.loadFile(scriptsPath, 'hubot-sonarr.js')
  ];
};
