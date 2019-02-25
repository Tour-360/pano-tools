const fs = require('fs');
const { exec } = require('child_process');
const chokidar = require("chokidar");
const sf = require('sanitize-filename');
const { files, tempPostOptions, bar } = require('./utils.js');
const { stages, execs } = require('./config.json');
const path = require("path");

const exiftool = path.resolve(__dirname + execs.exiftool);

const panoDir = path.resolve(stages[5]);
const jpegDir = path.resolve(stages[6]);

const psQueue = [];
let progress = 0;
const completeMessage = "Экспорт в Jpeg успешно завершен";

module.exports = () => {
  return new Promise((resolve, reject) => {
      const panos = files(panoDir, 'tif');
      panos.map( fileName => {
        fileName = fileName.split('.')[0]
        const newFile = path.resolve(jpegDir, fileName + '.jpg');
        !fs.existsSync(newFile) && psQueue.push(fileName);
      })

      tempPostOptions({
        panoImport: panoDir,
        panoExport: jpegDir
      });

      if(psQueue.length) {
        console.log("Идет экспорт панорам в Jpeg".bold);
        exec(`${exiftool} -tagsfromfile ${path.resolve(__dirname, "templates/cameraRow/pano_standart.xmp")} -all:all ${panoDir.replace(/([\s+\(\)])/g, '\\$1')}/*.tif -overwrite_original`, () => {
          !fs.existsSync(jpegDir) && fs.mkdirSync(jpegDir);

          bar.start(panos.length);
          const watcher = chokidar.watch(jpegDir).on('add', (filePath) => {
            bar.update(++progress);
          });

          exec(`open -W ${execs.photoshop} --args ${__dirname}/scripts/pano_to_jpeg.jsx`, () => {
            watcher.close();
            bar.stop();
            resolve(completeMessage);
          });
        });
      } else {
        resolve(completeMessage);
      }
  });
}

