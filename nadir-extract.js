const fs = require('fs-extra');
const { exec } = require('child_process');
const path = require("path");
const chokidar = require("chokidar");
const { files, bar } = require('./utils.js');
const { stages, execs } = require('./config.json');

const panoDir = path.resolve(stages[3]);
const nadirDir = path.resolve(stages[4]);
const completeMessage = "Надиры успешно экспортированы";
var readline = require('readline');


module.exports = () => {
  return new Promise((resolve, reject) => {
    !fs.existsSync(nadirDir) && fs.mkdirSync(nadirDir);
    const template =  fs.readFileSync(__dirname + '/templates/ptgui/nadir_extract.pts');
    const ptguiQueue = [];
    const panos = files(panoDir, 'tif');
    let progress = 0;

    panos.map(panoName => {
      panoName = panoName.split('.')[0];

      const projectFileName = path.resolve(nadirDir, panoName + '.pts');
      const tiffFileName = path.resolve(nadirDir, panoName + '.tif');

      if (!fs.existsSync(tiffFileName)){
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
      console.log('Идет процесс экспортирования надиров'.bold);

      bar.start(panos.length, 0);

      const watcher = chokidar.watch(nadirDir, {ignored: '**/*.pts'}).on('add', (filePath) => {
        bar.update(++progress);
      });

      exec(`open '/Applications/PTGui Pro.app' -n -W --args -batch -d -x ${ptguiQueue.map(p => `'${p}'`).join(' ')}`, () => {
        watcher.close();
        bar.stop();
        resolve(completeMessage);
      });
    } else {
      resolve(completeMessage);
    }
  })
}
