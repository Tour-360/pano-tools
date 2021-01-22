const fs = require('fs-extra');
const cliProgress = require('cli-progress');
const { spawn } = require('child_process');
const path = require("path");
const { notification } = require('../utils');
const _ = require('lodash');

const { files, createQueues, bar, getProject } = require('../utils.js');

exports.command = 'hdr'
exports.desc = 'Объединение снимков в HDR.'
exports.builder = {};

exports.handler = async () => {
  const { stages, execs, presets } = require('../config.json');
  const enfuse = path.resolve(__dirname, '../', execs.enfuse);
  const tiffDir = path.resolve(stages[1]);
  const hdrDir = path.resolve(stages[2]);

  const project = getProject();
  const preset = presets[project.preset];
  const { bracketing, directions } = preset;

  const enfuseQueues = [];

  !fs.existsSync(hdrDir) && fs.mkdirSync(hdrDir);

  const tiffFiles = []
  try {
    tiffFiles.push(...files(tiffDir, 'tif'));
  } catch {
    notification.error('Не найлено исходных файлов в папке');
    return process.exit(1);
  }

  const shotsOnPano = bracketing * directions;
  !_.isInteger(tiffFiles.length / shotsOnPano) && reject(`Количество исходных файлов должно быть кратно ${shotsOnPano}`);

  const panos = _.chunk(_.chunk(tiffFiles, bracketing), directions);

  panos.map((pano, panoId) => {
    pano.map((shots, sideId) => {tiffFiles
        const newDir = path.resolve(hdrDir, panoId.toString());
        const newFile = path.resolve(newDir, `${sideId+1}.tif`);
        !fs.existsSync(newDir) && fs.mkdirSync(newDir);
        !fs.existsSync(newFile) && enfuseQueues.push({
          newFile,
          shots: shots.map(s => path.resolve(tiffDir, s)),
        });
    });
  })

  if (enfuseQueues.length) {
    const execEnfuse = (callback) => {
      const task = enfuseQueues.shift();
      if (task) {
        const proc = spawn(enfuse, ["-o", task.newFile, ...task.shots]);
        proc.on('close', (code) => {
          execEnfuse(callback);
          bar.update(++progress);
        });
      } else callback();
    }

    console.log(`Началось создание HDR в папку ${hdrDir}`.bold);
    const total = tiffFiles.length / bracketing;
    let progress = total - enfuseQueues.length;
    bar.start(total, progress);

    createQueues(execEnfuse, () => {
      bar.stop();
      notification.success('Объединение снимков в HDR успешно завершено.');
    });
  } else {
    if (tiffFiles.length){
      notification.success('HDR изображения для всех файлов уже были созданы');
    } else {
      notification.warning('Нет файлов для создания HDR');
    }
  }
}
