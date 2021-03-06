const fs = require('fs');
const path = require("path");
const chokidar = require("chokidar");
const cliProgress = require('cli-progress');
const { exec } = require('child_process');
const { files, bar, tempPostOptions, notification } = require('../utils.js');
const { stages } = require('../config.json');

exports.comand = 'prepare';
exports.desc = 'Подготовка фотографий к работе, конвертация RAW файлов';

exports.handler = () => {
  const rawDir = path.resolve(stages[0]);
  const tiffDir = path.resolve(stages[1]);
  const xmpTemplate = path.resolve(__dirname + "../templates/cameraRow/cr2_to_tiff.xmp");
  const completeMessage = "RAW файлы успешно обработанны.";

  !fs.existsSync(rawDir) && notification.error(`Не найдено папки с фотографиями ${rawDir}`);
  const rowFiles = files(rawDir, 'cr2');
  !rowFiles.length && notification.error(`Не найдено фотографий в папке ${rawDir}`);
  const psQueue = [];
  let progress = 0;

  rowFiles.map( fileName => {
    const baseName = fileName.split('.')[0];
    const newXmpTemplate = rawDir + "/" + baseName + ".xmp";
    const newTiffFile = tiffDir + "/" + baseName + ".tif";
    !fs.existsSync(newXmpTemplate) && fs.copyFileSync(xmpTemplate, newXmpTemplate);
    !fs.existsSync(newTiffFile) && psQueue.push(fileName);
  })

  if (psQueue.length){
    console.log(`Началась обработка RAW файлов в папку ${tiffDir}`.bold);
    !fs.existsSync(tiffDir) && fs.mkdirSync(tiffDir);

    tempPostOptions({rawImport: rawDir, rawExport: tiffDir});

    bar.start(rowFiles.length, progress);
    const watcher = chokidar.watch(tiffDir).on('add', (filePath) => {
      bar.update(++progress);
    });
    exec(`open -W ${execs.photoshop} --args ${__dirname}/../scripts/cr2_to_tif.jsx`, () => {
      bar.stop();
      watcher.close();
      notification.success(completeMessage);
    })
  } else {
    notification.success(completeMessage);
  }
}
