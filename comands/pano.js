const fs = require('fs-extra');
const path = require("path");
const { exec } = require('child_process');
const chokidar = require("chokidar");
const cliProgress = require('cli-progress');
const { notification } = require('../utils');

const { dirs, bar, getProject, ifExistSync } = require('../utils.js');



exports.comand = 'pano'
exports.desc = 'Объединение снимков в панорамы'
exports.builder = {
  jpeg: {
    alias: 'j',
    desc: 'Конвертация из папки ' + stages[2] + '_JPEG в папку ' + stages[6],
    type: 'boolean',
    default: false,
  }
};

exports.handler = ({ jpeg }) => {
  const project = getProject();
  const { stages, execs } = require('../config.json');

  const hdrDir = path.resolve(stages[2] + (jpeg ? '_JPEG' : ''));
  const panoDir = path.resolve(jpeg ? stages[6] : stages[3]);

  const template =  fs.readFileSync(path.resolve(
    __dirname,
    '../',
    'templates/ptgui/',
    project.preset + (jpeg ? '_jpeg' : '') + '.pts',
  ));

  const panos = dirs(hdrDir);
  const ptguiQueue = [];

  !ifExistSync(panoDir) && fs.mkdirSync(panoDir);

  panos.map(panoName => {
    const projectFileName = path.resolve(panoDir, `${panoName}.pts`);
    const resultFileName = path.resolve(panoDir, `${panoName}.${jpeg ? 'jpg' : 'tif'}`);
    if (!ifExistSync(projectFileName)) {
      fs.writeFileSync(
        projectFileName,
        template.toString('utf8').replace(/pano_name/g, panoName)
      );
    }

    if (!ifExistSync(resultFileName)){
      ptguiQueue.push(projectFileName);
    }
  });

  if (ptguiQueue.length){
    notification.info(`Началась сшифка панорам в папку ${panoDir}`);
    let progress = 0;
    bar.start(panos.length, progress);
    const watcher = chokidar.watch(panoDir, {ignored: '**/*.pts'}).on('add', (filePath) => {
      bar.update(progress++);
    });
    exec(`open '/Applications/PTGui Pro.app' -n -W --args -batch -x ${ptguiQueue.map(p => `'${p}'`).join(' ')}`, () => {
      watcher.close();
      bar.stop();
      notification.success("Объединение снимков в панорамы успешно завершено.");
    });
  } else {
    if (panos.length) {
      notification.success("Все снимки уже были объединены в панорамы");
    } else {
      notification.warning("Нет снимков для объединения в панорамы");
    }
  }
}
