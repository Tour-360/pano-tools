const fs = require('fs-extra');
const { exec, execSync } = require('child_process');
const path = require("path");
const chokidar = require("chokidar");
const { files, bar, degToRad, notification } = require('../utils.js');
const { stages, execs } = require('../config.json');


exports.command = 'nadir-insert'
exports.desc = 'Внедрение надира'
exports.builder = {
  wide: {
    alias: 'w',
    desc: 'Супер широкий зенит',
    type: 'boolean',
    default: false,
  }
}
exports.builder = {};

exports.handler = ({ wide }) => {
  const panoDir = path.resolve(stages[3]);
  const nadirDir = path.resolve(stages[4]);
  const panoNadirDir = path.resolve(stages[5]);

  const template =  fs.readFileSync(path.resolve(__dirname, '../templates/ptgui/', wide ? 'nadir_insert_wide.pts' : 'nadir_insert.pts'));
  const exiftool = path.resolve(__dirname, '../', execs.exiftool);
  const ptguiQueue = [];
  let progress = 0;

  const panos = files(nadirDir, 'tif');

  panos.map(panoName => {

    const panoFIle = path.resolve(panoDir, panoName);
    panoName = panoName.split('.')[0];
    const projectFileName = path.resolve(nadirDir, panoName + ".pts");
    const tiffFileName = path.resolve(panoNadirDir, panoName + ".tif");

    let image = execSync(`${exiftool} '${panoFIle}' -s -s  -ImageWidth -ImageHeight`)
      .toString('utf8')
      .split('\n')
      .map(s => s.split(': ')[1]);

    image = {
      width: image[0],
      height: image[1]
    }

    if (!fs.existsSync(projectFileName)){
      fs.writeFileSync(
        projectFileName,
        template.toString('utf8')
          .replace(/pano_name/g, panoName)
          .replace(/IMAGE_WIDTH/g, image.width)
          .replace(/IMAGE_HEIGHT/g, image.height)
          .replace(/NADIR_GEGS/g, 140)
          .replace(/NADIR_SIZE/g,
            wide ?
            (1 / (Math.PI / Math.tan(degToRad(140) / 2))) * image.width :
            Math.ceil(image.width / Math.PI))
      );
    }

    if (!fs.existsSync(tiffFileName)){
      ptguiQueue.push(projectFileName);
    }
  });

  if (ptguiQueue.length){
    console.log("Идет процесс внедрение надиров в панорамы".bold);
    !fs.existsSync(panoNadirDir) && fs.mkdirSync(panoNadirDir);

    bar.start(panos.length, progress);

    const watcher = chokidar.watch(panoNadirDir).on('add', (filePath) => {
      bar.update(progress++);
    });

    exec(`open '/Applications/PTGui Pro.app' -n -W --args -batch -d -x ${ptguiQueue.map(p => `'${p}'`).join(' ')}`, () => {
      watcher.close();
      bar.stop();
      notification.success("Надиры успешно внедрены в панорамы");
    });

  } else {

    if (panos.length) {
      notification.success("Все надиыры уже были вшиты");
    } else {
      notification.warning("Нет панорам для вшития надиров");
    }
  }
}
