// const chokidar = require("chokidar");
const { files, bar } = require('./utils.js');
const path = require("path");
const { stages, presets, execs } = require('./config.json');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = (length) => {
  const fromDir = path.resolve(stages[0]);
  const toDir = path.resolve(stages[1]);
  const fromFilesLength = length || files(fromDir, 'cr2').length;
  return new Promise(async (resolve, reject) => {
    let currentProgress = 0;
    while (currentProgress < fromFilesLength) {
      currentProgress = files(toDir, 'tif').length;
      console.log(`${currentProgress}/${fromFilesLength}`);
      await sleep(5000);
    }
    resolve(`Каталог ${toDir} наполнен`);
  })
}


