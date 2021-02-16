const path = require("path");
const fs = require("fs-extra");
const { execSync } = require('child_process');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { files, bar, ifExistSync, notification } = require('../utils.js');
const { stages, execs } = require('../config.json');
const ptguiQueue = [];
const panoFiles = [];
const chokidar = require("chokidar");
const jpegDir = path.resolve(stages[6]);
const cubeDir = path.resolve(stages[7]);
const exiftool = path.resolve(__dirname, '../', execs.exiftool);


// TODO: Добавить спинер переделать очереди на async await
// TODO: Вотчер работает не правильно (по afp рисует разу 100% и пишет отрицательное время)

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

exports.command = 'cube'
exports.desc = 'Конвертация панорам в стороны куба'
exports.builder = {};


exports.handler = async () => {
  const workFiles = ['0', '1','2','3','4','5','ultra_wide_nadir'];

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
    workFiles.forEach((i) => {
      let templatePath = path.resolve(__dirname,  "../templates/ptgui/cube/",  i + ".pts");
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

    const chunkSize = workFiles.length * 50;
    const ptguiQueueChunked = ptguiQueue.chunk(chunkSize);

    if (ptguiQueueChunked.length > 1){
      notification.warning(`
Внимание!
Стороны куба будут обрабатываться в программе PTGui
За ${ptguiQueueChunked.length} раз(a) не более чем по ${chunkSize} изображений за раз.
Дождитесь завершения программы, не закрывайте PTGui`
      );
    }

    let progress = 0;
    bar.start(ptguiQueue.length, 0);

    const watcher = chokidar.watch(cubeDir,{
      ignored: '**/pano.jpg'
    }).on('add', (filePath) => {
      if (filePath.split('.').pop() === 'jpg') {
        bar.update(++progress);
      }
    });

    for (var i = 0; i < ptguiQueueChunked.length; i++) {
      try {
        await exec(`open '/Applications/PTGui Pro.app' -n -W --args -batch -d -x ${ptguiQueueChunked[i].map(p => `'${p}'`).join(' ')}`);
      } catch (e) {
        notification.error('Ощибка конвертации панорам в стороны куба');
        process.exit(1);
      }
    }

    panoFiles.forEach(async panoFile => {
      await fs.unlinkSync(panoFile);
    });

    watcher.close();
    bar.stop();
    notification.success('Конвертация панорам в стороны куба успешно завершена');
    process.exit(0);
  } else {
    console.log("Нет файлов для обработки".yellow);
  }
}
