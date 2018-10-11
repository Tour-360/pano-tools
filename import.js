const inquirer = require('inquirer');
const fs = require('fs');
const fse = require('fs-extra');
const Spinner = require('cli-spinner').Spinner;
const cliProgress = require('cli-progress');
const path = require("path");
const { dirs, bar } = require('./utils.js');
const { stages, otherPhotoFolder } = require('./config.json');

const exiftool = require('node-exiftool')
const ep = new exiftool.ExiftoolProcess();
const completeMessage = "Импорт фотографий успешно завершен.";

const rowPath = stages[0];
const currentDir = "Текущая папка";

module.exports = () => {
  return new Promise((resolve, reject) => {
    inquirer.prompt([{
      type: 'list',
      message: 'Выбирите устройство с фотографиями:',
      name: 'volme',
      choices: [...dirs('/Volumes'), currentDir]
    }]).then(({volme}) => {
      let folder = path.resolve();
      const importFromCurrentDir = volme == currentDir;
      if (!importFromCurrentDir) {
        const pathDCIM = '/Volumes/' + volme + '/DCIM';
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
              resolve({files, lens: lenses[0]})
            } else {
              inquirer.prompt([{
                type: 'list',
                message: 'Выбирите объектив на который были сняты панорамы:',
                name: 'lens',
                choices: lenses
              }]).then(({lens}) => {
                resolve({files, lens});
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
              resolve(completeMessage);
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
  });
};
