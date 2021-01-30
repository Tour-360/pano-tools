const fs = require('fs');

const util = require('util');
const exec = util.promisify(require('child_process').exec);

const { files, bar, notification } = require('../utils.js');
const { stages } = require('../config.json');
const path = require("path");

const panoDir = path.resolve(stages[3]);
const jpegDir = path.resolve(stages[6]);

const psQueue = [];
let progress = 0;


exports.command = 'jpeg [options]'
exports.desc = 'Convert panorams to jpeg'
exports.builder = {
  folder: {
    alias: 'f',
    default: panoDir
  }
};

exports.handler = async ({ folder }) => {
  console.log("Экспорт панорам в Jpeg".bold);

  const panos = files(folder ? path.resolve(folder) : panoDir, 'tif');
  panos.map( fileName => {
    fileName = fileName.split('.')[0]
    const newFile = path.resolve(jpegDir, fileName + '.jpg');
    !fs.existsSync(newFile) && psQueue.push(fileName);
  });

  if (psQueue.length) {
    !fs.existsSync(jpegDir) && fs.mkdirSync(jpegDir);

    bar.start(panos.length);
    bar.update(++progress);

    for (fileName of psQueue) {
      const tifFile = path.resolve(folder ? path.resolve(folder) : panoDir, fileName + '.tif');
      const jpgFile = path.resolve(jpegDir, fileName + '.jpg');
      await exec(`convert -quality 82 "${tifFile}" "${jpgFile}"`);
      bar.update(++progress);
    }

    bar.stop();
    notification.success("Jpeg'и успешно созданы");
  } else {
    if (panos.length) {
      notification.warning("Все Jpeg'и уже были созданы ранее");
    } else {
      notification.warning("Нет исходных файлов для создания Jpeg");
    }
  }
}
