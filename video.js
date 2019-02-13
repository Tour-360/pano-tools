const fs = require('fs');
const path = require("path");
const { exec } = require('child_process');
const { stages } = require('./config.json');

const jpegDir = path.resolve(stages[6]);

const pad = (str, max) => {
  str = str.toString();
  return str.length < max ? pad("0" + str, max) : str;
}

module.exports = (fileName) => {
  return new Promise((resolve, reject) => {
    const chunk = 0.33;
    const template =  fs.readFileSync(__dirname + '/templates/ptgui/video.pts');
    const filePath =  path.resolve(fileName);
    const fileDir =  path.dirname(filePath);
    const basename = path.basename(filePath).split('.').shift();
    const videoDir = path.resolve(fileDir, basename);

    const ptguiQueue = [];
    let projectFileName;

    !fs.existsSync(videoDir) && fs.mkdirSync(videoDir);

    for (var i = 0; i < (180 / chunk); i++) {
      projectFileName = path.resolve(videoDir, 'video_' + pad(i, 4) + '.pts');

      fs.writeFileSync(
        projectFileName,
        template.toString('utf8')
          .replace(/PANO_NAME/g, filePath)
          .replace(/BIAS/g, -(i * chunk))
      );

      ptguiQueue.push(projectFileName);
    }

    exec(`open '/Applications/PTGui Pro.app' -n -W --args -batch -d -x ${ptguiQueue.map(p => `'${p}'`).join(' ')}`, () => {
      // watcher.close();
      // bar.stop();
        exec(`ffmpeg -framerate 30 -pattern_type glob -i '${videoDir}/*.jpg' -c:v libx264 -r 30 '${fileDir}/${basename}.mp4'`, () => {
          resolve('OK');
        });
    });
  });
}
