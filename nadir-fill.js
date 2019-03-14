
module.exports = () => {
  return new Promise((resolve, reject) => {
    const fs = require('fs-extra');
    const { exec } = require('child_process');
    const path = require("path");
    const exiftool = require('node-exiftool');
    const chokidar = require("chokidar");
    const ep = new exiftool.ExiftoolProcess();
    const { files, bar, tempPostOptions, getProject } = require('./utils.js');
    const { stages, execs, presets } = require('./config.json');

    const completeMessage = "Надиры успешно заретушированы";
    const nadirDir = path.resolve(stages[4]);
    let progress = 0;
    const project = getProject();
    const nadirFill = presets[project.preset].nadirFill;


    ep
    .open()
    .then(() => ep.readMetadata(nadirDir, ['Software']))
    .then(r => {
      const psQueue = [];
      ep.close();
      return r.data
        .filter(r => !~r.Software.indexOf("Photoshop"))
        .map(r => r.SourceFile);
    }).then(files => {
      if (files.length) {
        console.log('Идет процесс ретуши надиров'.bold);
        console.log(nadirFill);
        tempPostOptions({ files, size: nadirFill });
        bar.start(files.length, 0);
        const watcher = chokidar.watch(nadirDir).on('change', (filePath) => {
          bar.update(++progress);
        });
        exec(`open -W ${execs.photoshop} --args ${__dirname}/scripts/nadir_fill.jsx`, () => {
          bar.stop();
          watcher.close();
          resolve(completeMessage);
        })
      } else {
        resolve(completeMessage);
      }
    });
  });
}
