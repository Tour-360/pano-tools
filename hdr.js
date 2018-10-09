const fs = require('fs-extra');
const cliProgress = require('cli-progress');
const { exec, spawn } = require('child_process');
const path = require("path");
const _ = require('lodash');

const { files, createQueues } = require('./utils.js');
const { stages, execs, bracketing, directions } = require('./config.json');

const enfuse = path.resolve(__dirname + execs.enfuse);


const bar = new cliProgress.Bar({
  format: '[{bar}] | {percentage}% | ETA: {eta_formatted}',
  clearOnComplete: true
}, cliProgress.Presets.rect);


module.exports = () => {
  return new Promise((resolve, reject) => {
    const enfuseQueues = [];
    const tiffDir = path.resolve(stages[1]);
    const hdrDir = path.resolve(stages[2]);

    const tiffFiles = files(tiffDir, 'tif');
    const panos = _.chunk(_.chunk(tiffFiles, bracketing), directions);


    panos.map((pano, panoId) => {
      pano.map((shots, sideId) => {
          const newDir = path.resolve(`${hdrDir}/${panoId}`);
          const newFile = path.resolve(`${newDir}/${sideId+1}.tif`);
          !fs.existsSync(newDir) && fs.mkdirSync(newDir);
          !fs.existsSync(newFile) && enfuseQueues.push({
            newFile,
            shots: shots.map(s => path.resolve(tiffDir + "/" + s)),
          });
      });
    })

    const total = tiffFiles.length / bracketing;
    let progress = total - enfuseQueues.length;
    bar.start(total, progress);

    const execEnfuse = (callback) => {
      const task = enfuseQueues.shift();
      if (task) {
        const proc = spawn(enfuse, ["-o", task.newFile, ...task.shots]);
        proc.on('close', (code) => {
          execEnfuse(callback);
          bar.update(progress++);
        });
      } else {
        callback();
      }
    }

    createQueues(execEnfuse, () => {
      bar.stop();
      resolve();
    });
  })
}
