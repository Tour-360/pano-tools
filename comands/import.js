const inquirer = require('inquirer');
const fs = require('fs');
const fse = require('fs-extra');
const Spinner = require('cli-spinner').Spinner;
const cliProgress = require('cli-progress');
const path = require("path");
const { dirs, bar, notification } = require('../utils.js');
const { stages, otherPhotoFolder } = require('../config.json');
const { execs } = require('../config.json');
const exiftoolBin = path.resolve(__dirname, '..', execs.exiftool);

const exiftool = require('node-exiftool')
const ep = new exiftool.ExiftoolProcess(exiftoolBin);
// const completeMessage = "Импорт фотографий успешно завершен.";

const rowPath = stages[0];
const currentDir = "Текущая папка";


exports.command = 'import'
exports.desc = 'Импорт фотографий'
exports.builder = {};

exports.handler = async () => {
  inquirer.prompt([{
    type: 'list',
    message: 'Выбирите устройство с фотографиями:',
    name: 'volume',
    choices: [...dirs('/Volumes'), currentDir]
  }]).then(({volume}) => {

    let folder = path.resolve();
    const importFromCurrentDir = volume == currentDir;
    if (!importFromCurrentDir) {
      const pathDCIM = '/Volumes/' + volume + '/DCIM';
      if(!fs.existsSync(pathDCIM)) {
        return reject('Ошибка: в выбраном месте нет папки DCIM с фотографиями');
      }
      folder = pathDCIM + '/' + dirs(pathDCIM).filter(r => ~r.indexOf('100'))[0];
    }

    var spinner = new Spinner('Загрузка информации из фотографий');
    spinner.setSpinnerString(18);
    spinner.start();

    ep
      .open()
      .then(() => ep.readMetadata(folder, ['LensID']))
      .then(r => {
        spinner.stop(true);
        return new Promise((resolve) => {
          const files = r.data;
          const lenses = Array.from(new Set(files.map(e=>e.LensID))).filter(e => e);
          if (lenses.length == 1) {
            return resolve({files, lens: lenses[0]})
          } else {
            inquirer.prompt([{
              type: 'list',
              message: 'Выбирите объектив на который были сняты панорамы:',
              name: 'lens',
              choices: lenses
            }]).then(({lens}) => {
              return resolve({files, lens});
            });
          }
        });
      }, console.error)
      .then(({files, lens}) => {
        let progress = 1;
        bar.start(files.length, progress);
        const tick = () => {
          bar.update(++progress);
          if(progress == files.length) {
            bar.stop();
            notification.success('Импорт фотографий успешно завершен.');
          }
        }

        files.map((f) => {
          const fileName = path.basename(f.SourceFile);
          const newFile = ( f.LensID == lens ? rowPath : otherPhotoFolder ) + '/' + fileName;
          fse.mkdirsSync(rowPath);
          fse.mkdirsSync(otherPhotoFolder);

          fs.existsSync(newFile) ? tick() : fs[importFromCurrentDir ? 'rename' : 'copyFile'](
            f.SourceFile,
            newFile,
            tick
          );

        });
      })
      .then(() => ep.close())
      .catch(console.error)
  });
};

