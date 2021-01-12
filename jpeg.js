const fs = require('fs');

const util = require('util');
const exec = util.promisify(require('child_process').exec);

const chokidar = require("chokidar");
const sf = require('sanitize-filename');
const { files, tempPostOptions, bar } = require('./utils.js');
const { stages, execs } = require('./config.json');
const path = require("path");

const panoDir = path.resolve(stages[3]);
const jpegDir = path.resolve(stages[6]);

const psQueue = [];
let progress = 0;
const completeMessage = "Экспорт в Jpeg успешно завершен";

module.exports = () => {
  return new Promise(async (resolve, reject) => {
    const panos = files(panoDir, 'tif');
    console.log(panos);
    panos.map( fileName => {
      fileName = fileName.split('.')[0]
      const newFile = path.resolve(jpegDir, fileName + '.jpg');
      console.log(newFile);
      !fs.existsSync(newFile) && psQueue.push(fileName);
    });

    console.log(psQueue);

    if(psQueue.length) {
      console.log("Идет экспорт панорам в Jpeg".bold);
      !fs.existsSync(jpegDir) && fs.mkdirSync(jpegDir);

      bar.start(panos.length);
      bar.update(++progress);

      for (fileName of psQueue) {
        const tifFile = path.resolve(panoDir, fileName + '.tif');
        const jpgFile = path.resolve(jpegDir, fileName + '.jpg');
        await exec(`convert -quality 82 "${tifFile}" "${jpgFile}"`);
        bar.update(++progress);
      }

      bar.stop();
      resolve(completeMessage);

    } else {
      resolve(completeMessage);
    }
  });
}

