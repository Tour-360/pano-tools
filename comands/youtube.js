const path = require("path");
const {execSync } = require('child_process');
const { files, notification } = require('../utils.js');
const Spinner = require('cli-spinner').Spinner;
const { stages } = require('../config.json');

exports.command = 'youtube';
exports.desc = 'Создание видео для YouTub';

exports.handler = async () => {

  const spinner = new Spinner(`Идет процес создания видео для youtube`);
  spinner.setSpinnerString(18);
  spinner.start();

  const jpegDir = path.resolve(stages[6]);
  const images = files(jpegDir);
  const imagesString = images.map(f => `'${path.resolve(jpegDir, f)}'`).join(' -i ');

  await notification.warning('Команда может быть не рабочей, прпробуйте запустить процесс вручную командой:');
  console.log(`ffmpeg -f concat -r 1/5 -i ${imagesString} -crf 20 -r 30 -c:v libx264 -preset slow -profile:v high -bf 2 -g 30 -coder 1 -crf 18 -pix_fmt yuv420p -movflags +faststart 360.mp4 -y -loglevel warning`);
  execSync(`ffmpeg -f concat -r 1/5 -i ${imagesString} -crf 20 -r 30 -c:v libx264 -preset slow -profile:v high -bf 2 -g 30 -coder 1 -crf 18 -pix_fmt yuv420p -movflags +faststart 360.mp4 -y -loglevel warning`);
  spinner.stop();
  await notification.success('Видео для youtube создано');
  await notification.info('Файл: 360.mp4');
}
