const { files, bar, notification } = require('../utils.js');
const fs = require('fs-extra');
const path = require("path");
const { stages } = require('../config.json');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

exports.command = 'watch-jpeg'
exports.desc = 'Следить за наполнением каталога ' + stages[5];
exports.builder = {
  amount: {
    alias: 'a',
    desc: 'Amount files',
  },
  import: {
    alias: 'i',
    default: stages[5],
    desc: 'Import folder',
  },
  export: {
    alias: 'e',
    default: stages[6],
    desc: 'Export folder',
  },
  'import-format': {
    alias: 'f',
    default: 'tif',
    desc: 'Import format'
  },
  'export-format': {
    alias: 'l',
    default: 'jpg',
    desc: 'Export format'
  }
};

exports.handler = async ({
 amount,
 import: importPatch,
 export: exportPatch,
 'import-format': importFormat,
 'export-format': exportFormat
}) => {
  const fromDir = path.resolve(importPatch);
  const toDir = path.resolve(exportPatch);
  try {
    await fs.mkdirp(toDir);
  } catch (e) {
    await notification.error('Не удалось создать папку ' + toDir);
    return process.exit(1);
  }
  const fromFilesLength = amount || files(fromDir, importFormat).length;
  let currentProgress = 0;
  bar.start(fromFilesLength);
  while (currentProgress < fromFilesLength) {
    currentProgress = files(toDir, exportFormat).length;
    bar.update(currentProgress);
    await sleep(5000);
  }
  bar.stop();
  await notification.success(`Все ${exportFormat} файлы экспортированы`);
}


