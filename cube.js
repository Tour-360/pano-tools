const path = require("path");
const fs = require("fs-extra");
const { exec, execSync } = require('child_process');
const { files, bar } = require('./utils.js');
const { stages, execs } = require('./config.json');
const ptguiQueue = [];
const panoFiles = [];
const jpegDir = path.resolve(stages[6]);
const cubeDir = path.resolve(stages[7]);
const exiftool = path.resolve(__dirname, execs.exiftool);

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
        const jpegPath = path.resolve(jpegDir, panoName + ".jpg");
        fs.copySync(jpegPath, panoFile);
        let image = execSync(`${exiftool} '${jpegPath}' -s -s  -ImageWidth -ImageHeight`)
          .toString('utf8')
          .split('\n')
          .map(s => s.split(': ')[1]);

        image = {
          width: image[0],
          height: image[1]
        }

        const size = Math.pow(2, Math.round(Math.log(image.width / Math.PI) / Math.log(2)));

        ['0', '1','2','3','4','5','ultra_wide_nadir'].forEach((i) => {
          let templatePath = path.resolve(__dirname,  "templates/ptgui/cube/",  i + ".pts");
          var ptsPath = path.resolve(panoFolder, i + ".pts");
          const template =  fs.readFileSync(templatePath);
          fs.writeFileSync(
            ptsPath,
            template.toString('utf8')
              .replace(/IMAGE_WIDTH/g, image.width)
              .replace(/IMAGE_HEIGHT/g, image.height)
              .replace(/EXPORT_SIZE/g, i === 'ultra_wide_nadir' ? 256 : size)
          );
          ptguiQueue.push(ptsPath);
        });
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
