const fs = require('fs-extra');
const path = require("path");
const { exec, execSync } = require('child_process');
const { dirs, createQueues, bar } = require('./utils.js');
const { stages, execs } = require('./config.json');
const mkdirp = require('mkdirp');

const jpegDir = path.resolve(stages[6]);
const cubeDir = path.resolve(stages[7]);
const playerDir = path.resolve(stages[8]);
const queue = [];
let progress = 0;

const exiftool = path.resolve(__dirname, execs.exiftool);

const completeMessage = "Конвертация сторон куба для веб-плеера, успешно завершена";

module.exports = () => {
  return new Promise((resolve, reject) => {
    !fs.existsSync(playerDir) && fs.mkdirSync(playerDir);
    const panos = dirs(cubeDir);
    if (panos.length) {
      panos.map(panoName => {
        const panoFolder = path.resolve(playerDir, panoName);
        const cubeFolder = path.resolve(cubeDir, panoName);

        let cubeSize = parseInt(execSync(`${exiftool} '${cubeFolder}/0.jpg' -s -s  -ImageWidth`)
          .toString('utf8')
          .split('\n')
          .map(s => s.split(': ')[1])[0]);

        let lowSize = cubeSize / 2;
        let standardSize = cubeSize;

        if (!fs.existsSync(panoFolder)){
          [
            { name: "low", size: lowSize + "x" + lowSize, quality: "60" },
            { name: "standard", size: standardSize + "x" + standardSize, quality: "85" },
          ].map(props => {
            const folder = path.resolve(panoFolder, props.name);
            for (var i = 0; i < 6; i ++) {
              queue.push({
                ...props,
                type: "convert",
                input: path.resolve(cubeDir, panoName, i + '.jpg'),
                output: path.resolve(folder, i + '.jpg')
              })
            }
          })

          queue.push({
            type: "convert",
            size: "256x128",
            quality: "95",
            input: path.resolve(jpegDir, panoName + '.jpg'),
            output: path.resolve(panoFolder, 'thumbnail', 'mini.jpg')
          })

          queue.push({
            type: "montage",
            size: "128x",
            quality: "30",
            input: path.resolve(cubeDir, panoName, '?.jpg'),
            output: path.resolve(panoFolder, 'thumbnail', '0.jpg')
          })

          queue.push({
            type: "convert",
            size: "756x756",
            quality: "78",
            input: [path.resolve(cubeDir, panoName, 'ultra_wide_nadir' + '.jpg')],
            output: path.resolve(panoFolder, 'thumbnail', 'uwn.jpg')
          })
        }
      })
    }

    const convert = (callback) => {
      const step = () => {
        bar.update(++progress);
        convert(callback);
      }

      const task = queue.shift();

      if (task) {
        const {type, size, quality, input, output} = task;

        mkdirp(path.dirname(output), () => {
          if (type === "convert") {
            exec(`convert -resize ${size} -quality ${quality} -format jpg '${input}' '${output}'`, step);
          } else {
            exec(`montage -mode concatenate -tile 6x -resize ${size} -quality ${quality} -format jpg '${input}' '${output}'`, step);
          }
         });
      } else callback();
    }


    if (queue.length) {
      console.log("Начался процес конвертации сторон куба для веб плеера");

      bar.start(queue.length, progress);
      createQueues(convert, () => {
        bar.stop();
        resolve(completeMessage)
      });
    } else {
      resolve(completeMessage)
    }
  })
}
