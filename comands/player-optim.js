const path = require("path");
const Spinner = require('cli-spinner').Spinner;
const { notification, bar, dirs } = require('../utils');
const { stages } = require('../config.json');
const playerDir = path.resolve(stages[8]);

const imagemin = require('imagemin-keep-folder');
const imageminMozjpeg = require('imagemin-mozjpeg');


exports.comand = 'player-optim';
exports.desc = 'Оптимизация изображений веб-плеера';
exports.builder = {
  quality: {
    alias: 'q',
    desc: 'Quality',
    type: 'number',
    default: '80',
  },
  progressive: {
    alias: 'p',
    desc: 'Progressive JPEG',
    type: 'boolean',
    default: false
  }
};

exports.handler = async ({ quality, progressive }) => {

  notification.info('Процес оптимизации изображений для плеера');

  const spinner = new Spinner('Получение списка фотографий для оптимизации');
  spinner.setSpinnerString(18);
  spinner.start()

  const filePath = path.resolve(playerDir);
  const files = dirs(filePath);
  spinner.stop(false);

  bar.start(files.length, 0);

  for (let i = 0; i < files.length; i++) {
    try {
      await imagemin([path.resolve(filePath, files[i], '**', '*.jpg')], {
        plugins: [
          imageminMozjpeg({
            quality,
            progressive
          }),
        ]
      });
    } catch (e) {
      notification.error('Ошибка оптимизации панорамы: ', files[i]);
    }
    bar.update(i);
  }

  bar.stop();
  if (files.length) {
    notification.success('Оптимизация изображений успешно завершена');
  } else {
    notification.warning('Нет файлов плеера для оптимизации');
  }
  process.exit(0);
}


