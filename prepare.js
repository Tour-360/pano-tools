const fs = require('fs');
const path = require("path");
const chokidar = require("chokidar");
const cliProgress = require('cli-progress');
const { exec } = require('child_process');
const { files, tempPostOptions } = require('./utils.js');
const { stages, execs } = require('./config.json');

const rowDir = path.resolve(stages[0]);
const tiffDir = path.resolve(stages[1]);
const xmpTemplate = path.resolve(__dirname + "/templates/cameraRow/cr2_to_tiff.xmp");

const bar = new cliProgress.Bar({
  format: '[{bar}] | {percentage}% | ETA: {eta_formatted}',
  clearOnComplete: true
}, cliProgress.Presets.rect);


module.exports = () => {
  return new Promise((resolve, reject) => {
    const rowFiles = files(rowDir, 'cr2');
    const psQueue = [];
    var progress = 0;

    rowFiles.map( fileName => {
      const baseName = fileName.split('.')[0];
      const newXmpTemplate = rowDir + "/" + baseName + ".xmp";
      const newTiffFile = tiffDir + "/" + baseName + ".tif";
      !fs.existsSync(newXmpTemplate) && fs.copyFileSync(xmpTemplate, newXmpTemplate);
      !fs.existsSync(newTiffFile) && psQueue.push(fileName);
    })

    if (psQueue.length){
      tempPostOptions({rawImport: rowDir, rawExport: tiffDir});
      bar.start(rowFiles.length, progress);
      const watcher = chokidar.watch(tiffDir).on('add', (filePath) => {
        bar.update(progress++);
      });
      exec(`open -W ${execs.photoshop} --args ${__dirname}/scripts/cr2_to_tif.jsx`, () => {
        bar.stop();
        watcher.close();
        resolve();
      })
    } else {
      resolve();
    }
  })
}
