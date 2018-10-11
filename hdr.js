const fs = require('fs-extra');
const cliProgress = require('cli-progress');
const { spawn } = require('child_process');
const path = require("path");
const _ = require('lodash');

const { files, createQueues, bar } = require('./utils.js');
const { stages, execs, bracketing, directions } = require('./config.json');
const enfuse = path.resolve(__dirname + execs.enfuse);
const tiffDir = path.resolve(stages[1]);
const hdrDir = path.resolve(stages[2]);
const completeMessage = "Объединение снимков в HDR успешно завершено."

module.exports = () => {
  return new Promise((resolve, reject) => {
    const enfuseQueues = [];

    !fs.existsSync(hdrDir) && fs.mkdirSync(hdrDir);

    const tiffFiles = files(tiffDir, 'tif');
    const shotsOnPano = bracketing * directions;
    !_.isInteger(tiffFiles.length / shotsOnPano) && reject(`Количество исходных файлов должно быть кратно ${shotsOnPano}`);

    const panos = _.chunk(_.chunk(tiffFiles, bracketing), directions);

    panos.map((pano, panoId) => {
      pano.map((shots, sideId) => {
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
        resolve(completeMessage);
      });
    } else {
        resolve(completeMessage);
    }
  })
}
