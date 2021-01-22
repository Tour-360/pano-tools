const fs = require('fs');
const path = require("path");
const { dirs, files, bar, getProject, notification } = require('../utils.js');
const { stages, execs } = require('../config.json');
const nadirDir = path.resolve(stages[4]);
const { exec } = require('child_process');
var sizeOf = require('image-size');



exports.command = 'mark [options]'
exports.desc = 'Добавление вотермарки в надиры'
exports.builder = {
  template: {
    alias: 't',
    default: 'default'
  },
  size: {
    alias: 's',
    default: 30,
  }
};


exports.handler = ({template, size}) => {
  const images = [];
  try {
    images.push(...files(nadirDir, 'tif'));
  } catch {
    notification.error('Ошибка чтения исходных надиров');

    return process.exit(1);
  }

  bar.start(files.length, 0);
  images.map((file, i) => {

    const image = path.resolve(nadirDir, file);

    const imageSize = sizeOf(image);
    const imSize = [
      imageSize.width,
      imageSize.height
    ].map(s => Math.round(s / 100 * size)).join('x');

    const templateFile = path.resolve(__dirname, '../', 'templates', 'watermarks', template + '.png');
    exec(`convert -background none '${image}' \\( '${templateFile}' -resize ${imSize} \\) -gravity center -composite '${image}'`, err => {
      if (err) {
        notification.error('Ошибка вшития вотермарки');
        return process.exit(1);
      }
      bar.update(i);
      if(i+1 == images.length) {
        bar.stop();
        notification.success('Вотермарки вшиты в надиры');
      }
    })

  });
}
