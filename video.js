const fs = require('fs');
const path = require("path");
const chokidar = require("chokidar");
const { exec, execSync } = require('child_process');
const { bar } = require('./utils.js');

const { stages } = require('./config.json');

const jpegDir = path.resolve(stages[6]);

const pad = (str, max) => {
  str = str.toString();
  return str.length < max ? pad("0" + str, max) : str;
}

module.exports = (fileName, options) => {
  return new Promise((resolve, reject) => {
    const template =  fs.readFileSync(__dirname + '/templates/ptgui/video.pts');
    const filePath =  path.resolve(fileName);
    const fileDir =  path.dirname(filePath);
    const basename = path.basename(filePath).split('.').shift();
    const videoDir = path.resolve(fileDir, basename);
    let   progress = 0;

    let image = execSync(`exiftool ${filePath} -s -s  -ImageWidth -ImageHeight`)
      .toString('utf8')
      .split('\n')
      .map(s => s.split(': ')[1]);

    image = {
      width: image[0],
      height: image[1]
    }

    const ptguiQueue = [];
    let projectFileName;

    !fs.existsSync(videoDir) && fs.mkdirSync(videoDir);


    const { start, end, fps, time } = options;
    const chunk = (end - start ) / (time * fps);

    for (var i = start; i < end; i += chunk) {
      projectFileName = path.resolve(videoDir, 'video_' + pad(i.toFixed(4), 9) + '.pts');

      fs.writeFileSync(
        projectFileName,
        template.toString('utf8')
          .replace(/IMAGE_WIDTH/g, image.width)
          .replace(/IMAGE_HEIGHT/g, image.height)
          .replace(/VIDEO_WIDTH/g, options.width)
          .replace(/VIDEO_HEIGHT/g, options.height)
          .replace(/PANO_NAME/g, filePath)
          .replace(/BIAS/g, -i)
      );

      ptguiQueue.push(projectFileName);
    }

    bar.start(ptguiQueue.length, 0);

    const watcher = chokidar.watch(videoDir, {ignored: '**/*.pts'}).on('add', (filePath) => {
      bar.update(++progress);
    });

    exec(`open '/Applications/PTGui Pro.app' -n -W --args -batch -d -x ${ptguiQueue.map(p => `'${p}'`).join(' ')}`, () => {
      watcher.close();
      bar.stop();

      console.log("Сохранение видео");

      exec(`ffmpeg -framerate ${fps} -pattern_type glob -i '${videoDir}/*.jpg' -c:v libx264 -r ${fps} '${fileDir}/${basename}.mp4'`, () => {
        resolve(`Видео ${basename}.mp4 готово`);
      });
    });
  });
}
