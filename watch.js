const chokidar = require("chokidar");
const { files, bar } = require('./utils.js');

module.exports = (fromDir, toDir) => {
  return new Promise((resolve, reject) => {
    const fromFiles = files(fromDir);
    const toFiles = files(toDir);
    let progress = toFiles.length;

    bar.start(fromFiles.length+1, progress);
    const watcher = chokidar.watch(toDir).on('change', (filePath) => {
      bar.update(progress);
      if (progress >= fromFiles.length) {
        bar.stop();
        watcher.close();
      }
    });
  })
}


