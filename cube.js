const path = require("path");
const fs = require("fs-extra");
const { exec } = require('child_process');
const { files, bar } = require('./utils.js');
const { stages, execs } = require('./config.json');
const ptguiQueue = [];
const panoFiles = [];


const jpegDir = path.resolve(stages[6]);
const cubeDir = path.resolve(stages[7]);

const completeMessage = "Конвертация панорам в стороны куба успешно завершена";


module.exports = () => {
  return new Promise((resolve, reject) => {
    files(jpegDir, 'jpg').map(panoName => {
      panoName = panoName.split('.')[0];
      panoFolder = path.resolve(cubeDir, panoName.toString());
      !fs.existsSync(cubeDir) && fs.mkdirSync(cubeDir);
      if (!fs.existsSync(panoFolder)){
        fs.mkdirSync(panoFolder);
        const panoFile = path.resolve(panoFolder, 'pano.jpg');
        panoFiles.push(panoFile);
        fs.copySync(path.resolve(jpegDir, panoName + ".jpg"), panoFile);
        for (var i = 0; i < 6; i ++) {
          var ptsPath = path.resolve(panoFolder, i + ".pts");
          fs.copySync(path.resolve(__dirname,  "templates/ptgui/cube/",  i + ".pts"), ptsPath );
          ptguiQueue.push(ptsPath);
        }
      }
    })

    if (ptguiQueue.length){
      console.log("Конвертация панорам в стороны куба".bold);
      exec(`open '/Applications/PTGui Pro.app' -n -W --args -batch -d -x ${ptguiQueue.map(p => `'${p}'`).join(' ')}`, () => {
        panoFiles.map(panoFile => {
          fs.unlink(panoFile);
        })
        resolve(completeMessage);
      });
    } else {
      resolve(completeMessage);
    }
  })
}
