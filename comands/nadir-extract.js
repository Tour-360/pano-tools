const fs = require('fs-extra');
const { exec, execSync } = require('child_process');
const path = require("path");
const chokidar = require("chokidar");
const { files, bar, notification } = require('../utils.js');
const { stages, execs } = require('../config.json');

const panoDir = path.resolve(stages[3]);
const nadirDir = path.resolve(stages[4]);
const exiftool = path.resolve(__dirname, '../', execs.exiftool);
const readline = require('readline');


exports.command = 'nadir-extract'
exports.desc = 'Извлечение надиров из панорам'
exports.builder = {};

exports.handler = () => {
  !fs.existsSync(nadirDir) && fs.mkdirSync(nadirDir);
  const template =  fs.readFileSync(path.resolve(__dirname, '../', 'templates/ptgui/nadir_extract.pts'));
  const ptguiQueue = [];
  const panos = files(panoDir, 'tif');
  let progress = 0;

  panos.map(panoName => {
    const PanoPath = path.resolve(panoDir, panoName);
    panoName = panoName.split('.')[0];
    const projectFileName = path.resolve(nadirDir, panoName + '.pts');
    const tiffFileName = path.resolve(nadirDir, panoName + '.tif');

    let image = execSync(`${exiftool} '${PanoPath}' -s -s  -ImageWidth -ImageHeight`)
      .toString('utf8')
      .split('\n')
      .map(s => s.split(': ')[1]);

    image = {
      width: image[0],
      height: image[1]
    }

    if (!fs.existsSync(tiffFileName)){
      fs.writeFileSync(
        projectFileName,
        template.toString('utf8')
          .replace(/pano_name/g, panoName)
          .replace(/IMAGE_WIDTH/g, image.width)
          .replace(/IMAGE_HEIGHT/g, image.height)
          .replace(/NADIR_SIZE/g, Math.ceil(image.width / Math.PI))
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
      notification.success("Надиры успешно экспортированы");

    });
  } else {
    if (panos.length) {
      notification.success("Все надиыры уже были экспортированы");
    } else {
      notification.warning("Нет панорам для экспорат надиров");
    }
  }
}
