const fs = require('fs-extra');
const path = require("path");
const { exec } = require('child_process');
const chokidar = require("chokidar");
const cliProgress = require('cli-progress');

const { dirs, bar } = require('./utils.js');
const { stages, execs } = require('./config.json');
const completeMessage = "Объединение снимков в панорамы успешно завершено.";

const hdrDir = path.resolve(stages[2]);
const panoDir = path.resolve(stages[3]);

module.exports = () => {
  return new Promise((resolve, reject) => {
    const template =  fs.readFileSync(__dirname + '/templates/ptgui/equidistant.pts');
    const panos = dirs(hdrDir);
    const ptguiQueue = [];

    !fs.existsSync(panoDir) && fs.mkdirSync(panoDir);

    panos.map(panoName => {
      const projectFileName = path.resolve(panoDir, `${panoName}.pts`);
      const tiffFileName = path.resolve(panoDir, `${panoName}.tif`);
      if (!fs.existsSync(projectFileName)) {
        fs.writeFileSync(
          projectFileName,
          template.toString('utf8').replace(/pano_name/g, panoName)
        );
      }

      if (!fs.existsSync(tiffFileName)){
        ptguiQueue.push(projectFileName);
      }
    });

    if (ptguiQueue.length){
      console.log(`Началась сшифка панорам в папку ${panoDir}`.bold);
      let progress = 0;
      bar.start(panos.length, progress);
      const watcher = chokidar.watch(panoDir, {ignored: '**/*.pts'}).on('add', (filePath) => {
        bar.update(progress++);
      });
      exec(`open '/Applications/PTGui Pro.app' -n -W --args -batch -x ${ptguiQueue.map(p => `'${p}'`).join(' ')}`, () => {
        watcher.close();
        bar.stop();
        resolve(completeMessage);
      });
    } else {
      resolve(completeMessage);
    }
  });
}
