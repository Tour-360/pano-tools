const path = require("path");
const fs = require("fs-extra");
const { exec, execSync } = require('child_process');
const { files, bar, ifExistSync } = require('./utils.js');
const { stages, execs } = require('./config.json');
const ptguiQueue = [];
const panoFiles = [];
const jpegDir = path.resolve(stages[6]);
const cubeDir = path.resolve(stages[7]);
const exiftool = path.resolve(__dirname, execs.exiftool);

const completeMessage = "Конвертация панорам в стороны куба успешно завершена";

Object.defineProperty(Array.prototype, 'chunk', {
  value: function(chunkSize) {
    var array = this;
    return [].concat.apply([],
      array.map(function(elem, i) {
        return i % chunkSize ? [] : [array.slice(i, i + chunkSize)];
      })
    );
  }
});


module.exports = () => {
  return new Promise((resolve, reject) => {
    !ifExistSync(cubeDir) && fs.mkdirSync(cubeDir);
    files(jpegDir, 'jpg').map(panoName => {
      panoName = panoName.split('.')[0];
      const panoFolder = path.resolve(cubeDir, panoName.toString());
      if (!ifExistSync(panoFolder)) {
        fs.mkdirSync(panoFolder);
      }
      const panoFile = path.resolve(panoFolder, 'pano.jpg');
      const jpegPath = path.resolve(jpegDir, panoName + ".jpg");
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
        const ptsPath = path.resolve(panoFolder, i + ".pts");
        const jpgPath = path.resolve(panoFolder, i + ".jpg");
        if (!ifExistSync(jpgPath)) {

          if (!fs.existsSync(panoFile)) {
            fs.symlinkSync(jpegPath, panoFile);
            panoFiles.push(panoFile);
          }


          if (!ifExistSync(ptsPath)) {
            const template = fs.readFileSync(templatePath);
            fs.writeFileSync(
              ptsPath,
              template.toString('utf8')
                .replace(/IMAGE_WIDTH/g, image.width)
                .replace(/IMAGE_HEIGHT/g, image.height)
                .replace(/EXPORT_SIZE/g, i === 'ultra_wide_nadir' ? 756 : size)
            );
          }
          ptguiQueue.push(ptsPath);
        }
      });
    })

    if (ptguiQueue.length){
      console.log(`Конвертация ${ptguiQueue.length} стороны куба`.bold);

      const chunkSize = 500;
      const ptguiQueueChunked = ptguiQueue.chunk(chunkSize);

      if (ptguiQueueChunked.length > 1){
        console.log(`
Внимание!
Стороны куба будут обрабатываться в программе PTGui ${ptguiQueueChunked.length} раз(a)
не более чем по ${chunkSize} изображений за раз. Дождитесь завершения программы, не закрывайте PTGui`.yellow
        );
      }

      for (var i = 0; i < ptguiQueueChunked.length; i++) {
        execSync(`open '/Applications/PTGui Pro.app' -n -W --args -batch -d -x ${ptguiQueueChunked[i].map(p => `'${p}'`).join(' ')}`);
      }

      panoFiles.map(panoFile => {
        fs.unlink(panoFile);
      })

      resolve(completeMessage);


      // // console.log(`Внимание! количество обрабатываемых сторон очень велико, программа сделает только первые 1000, для того что бы сделать остальные повторите команду`.red)
      // exec(`open '/Applications/PTGui Pro.app' -n -W --args -batch -d -x ${ptguiQueue.splice(0,1000).map(p => `'${p}'`).join(' ')}`, () => {
      //   panoFiles.splice(0,1000).map(panoFile => {
      //     fs.unlink(panoFile);
      //   })
      //
      //   resolve(completeMessage);
      // });
    } else {
      resolve(completeMessage);
    }
  })
}
