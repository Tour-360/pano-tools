const fs = require('fs-extra');
const { exec, execSync } = require('child_process');
const path = require("path");
const chokidar = require("chokidar");
const { files, bar } = require('./utils.js');
const { stages, execs } = require('./config.json');

const panoDir = path.resolve(stages[3]);
const nadirDir = path.resolve(stages[4]);
const panoNadirDir = path.resolve(stages[5]);
const exiftool = path.resolve(__dirname, execs.exiftool);

const template =  fs.readFileSync(__dirname + '/templates/ptgui/nadir_zenit_insert.pts');
const ptguiQueue = [];
let progress = 0;

const completeMessage = 'Надиры успешно внедрены в панорамы';

module.exports = () => {
  return new Promise((resolve, reject) => {
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
            .replace(/NADIR_SIZE/g, Math.ceil(image.width / Math.PI))
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

      exec(`open '/Applications/PTGui Pro.app' -n -W --args -batch -d ${ptguiQueue.map(p => `'${p}'`).join(' ')}`, () => {
        watcher.close();
        bar.stop();
        resolve(completeMessage);
      });

    } else {
      resolve(completeMessage);
    }
  })
}
