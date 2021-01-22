const { files, bar, notification } = require('../utils.js');
const path = require("path");
const { stages, presets, execs } = require('../config.json');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

exports.command = 'watch-jpeg'
exports.desc = 'Следить за наполнением каталога ' + stages[6];
exports.builder = {
  amount: {
    alias: 'a',
    desc: 'Amount files',
  }
};

exports.handler = async ({ amount }) => {
  const fromDir = path.resolve(stages[5]);
  const toDir = path.resolve(stages[6]);
  try {
    await fs.mkdirp(toDir);
  } catch (e) {
    notification.error('Не удалось создать папку ' + toDir);
    return process.exit(1);
  }
  const fromFilesLength = amount || files(fromDir, 'tif').length;
  let currentProgress = 0;
  bar.start(fromFilesLength);
  while (currentProgress < fromFilesLength) {
    currentProgress = files(toDir, 'jpg').length;
    bar.update(currentProgress);
    await sleep(5000);
  }
  bar.stop();
  notification.success('Все jpeg файлы экспортированы');
}


