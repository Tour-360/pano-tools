const { files, bar, notification } = require('../utils.js');
const fs = require('fs-extra');
const path = require("path");
const extractd = require('extractd');
const pipeline = require('util').promisify(require('stream').pipeline);
const { stages, presets, execs } = require('../config.json');
const rowDir = stages[0];
const hdrDir = stages[2]+'_JPEG';
const _ = require('lodash');

exports.command = 'jpeg-preview'
exports.desc = 'Создание jpeg из превью cr2 в папку ' + hdrDir;
exports.builder = {
  bracket: {
    alias: 'b',
    desc: 'Номер ступени прекитинга',
    default: 2,
    type: 'number',
  }
};

exports.handler = async ({ bracket }) => {
  await notification.info('Создание jpeg из превью cr2 в папку ' + hdrDir);
  try {
    await fs.mkdirp(hdrDir);
  } catch (e) {
    await notification.error('Не удалось создать папку', hdrDir);
  }

  const rowFiles = files(path.resolve(rowDir), 'cr2');
  bar.start(rowFiles.length / 3)
  let progress = 0;
  const panorams = _.chunk(rowFiles, 12);


  for (let panoId = 0; panoId < panorams.length; panoId++) {
    const panoFolder = path.resolve(hdrDir, panoId.toString());
    let id = 1;
    for (let i = bracket-1; i < panorams[panoId].length; i+=3) {
      const fileName = panorams[panoId][i];
      await fs.mkdirp(panoFolder);
      const done = await extractd.generate(path.resolve(rowDir, fileName), {
        stream: true
      });

      await pipeline(done.preview, require('fs').createWriteStream(
        path.resolve(panoFolder, (id++) + '.jpg')
      ));
      bar.update(++progress);
    }
  }

  bar.stop()
  notification.success('Все jpeg файлы экспортированы в папку '+ hdrDir);
}


