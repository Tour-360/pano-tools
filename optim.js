const path = require("path");
const { stages } = require('./config.json');
const playerDir = path.resolve(stages[8]);

const imagemin = require('imagemin-keep-folder');
const imageminMozjpeg = require('imagemin-mozjpeg');


module.exports = () => {
  return new Promise((resolve, reject) => {
    imagemin([path.resolve(playerDir, '**/*.jpg')], {
      plugins: [
        imageminMozjpeg({
          quality: 72,
          progressive: false
        }),
      ]
    })
    .then(() => {
      resolve('Оптимизация изображений успешно завершена');
    })
    .catch(e => {
      reject(e)
    });
  });
}


