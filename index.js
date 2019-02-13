#!/usr/bin/env node
const program = require('commander');
const inquirer = require('inquirer');
const package = require('./package.json');

const importRow = require('./import.js');
const prepare = require('./prepare.js');
const hdr = require('./hdr.js');
const pano = require('./pano.js');
const nadirExtract = require('./nadir-extract.js');
const nadirFill = require('./nadir-fill.js');
const nadirInsert = require('./nadir-insert.js');
const jpeg = require('./jpeg.js');
const cube = require('./cube.js');
const player = require('./player.js');
const web = require('./web.js');
const video = require('./video.js');
const deleteDirs = require('./delete.js');

program.version(package.version, '-v, --version');

program
  .command('init <name>')
  .description('Инициализация проекта, создание рабочей директории')
  .action((name) => {
    if (!fs.existsSync(name)){
      fs.mkdirSync(name);
      stages.map(folder => fs.mkdirSync(name + '/' + folder));
    } else {
      console.log('Проект уже существует');
    }
  })

program
  .command('import')
  .description('Импорт файлов с внешнего устройства')
  .action(() => {
      importRow().then(r => {
        console.log(r.green);
      }).catch(console.error);
  });


program
  .command('prepare')
  .description('Подготовка фотографий к работе, конвертация RAW файлов')
  .action(() => {
      prepare().then(r => {
        console.log(r.green);
      }).catch(console.error);
  });

program
  .command('hdr')
  .description('Объединение снимков в HDR.')
  .action(() => {
      hdr().then(r => {
        console.log(r.green)
      }).catch(console.error);
  });

program
  .command('pano')
  .description('Объединение снимков в панорамы')
  .action(() => {
      pano().then(r => {
        console.log(r.green);
      }).catch(console.error);
  });

program
  .command('nadir-extract')
  .description('Извлечение надиров из панорам')
  .action(() => {
      nadirExtract().then(r => {
        console.log(r.green);
      }).catch(console.error);
  });

program
  .command('nadir-fill')
  .description('Ретушь надиров')
  .action(() => {
      nadirFill().then(r => {
        console.log(r.green);
      }).catch(console.error);
  });

program
  .command('nadir-insert')
  .description('Внедрение надира')
  .action(() => {
      nadirInsert().then(r => {
        console.log(r.green);
      }).catch(console.error);
  });

program
  .command('jpeg')
  .description('Конвертация панорам в jpeg')
  .action(() => {
      jpeg().then(r => {
        console.log(r.green);
      }).catch(console.error);
  });

program
  .command('cube')
  .description('Конвертация панорам в стороны куба')
  .action(() => {
      cube().then(r => {
        console.log(r.green);
      }).catch(console.error);
  });

program
  .command('player')
  .description('Конвертация изображений сторон куба для веб-плеера')
  .action(() => {
      player().then(r => {
        console.log(r.green);
      }).catch(console.error);
  });

program
  .command('web')
  .description('Компоновка виртуального тура для веб')
  .action(() => {
      web().then(r => {
        console.log(r.green);
      }).catch(console.error);
  });

program
  .command('video')
  .description('Создание видео из панорамы')
  .action((file) => {
      video(file).then(r => {
        console.log(r.green);
      }).catch(console.error);
  });

program
  .command('delete')
  .description('Удаление временных рабочих каталогов')
  .action((file) => {
    deleteDirs(file).then(r => {
      console.log(r.green);
    }).catch(console.error);
  });


program
  .command('start')
  .description('Все этапы обработки кроме импорта')
  .action(() => {
      prepare()
        .then(r => {
          console.log(r.green);
          return hdr();
        })
        .then(r => {
          console.log(r.green);
          return pano();
        })
        .then(r => {
          console.log(r.green);
          return nadirExtract();
        })
        .then(r => {
          console.log(r.green);
          return inquirer.prompt({
            type: "confirm",
            name: "fill",
            message: 'Ретушировать надиры?',
            default: false
          })
        })
        .then( ({fill}) => {
          return (fill ? nadirFill() : false);
        })
        .then(r => {
          r && console.log(r.green);
          return nadirInsert();
        })
        .then(r => {
          console.log(r.green);
          return jpeg();
        })
        .then(r => {
          console.log(r.green);
          return cube();
        })
        .then(r => {
          console.log(r.green);
          return player();
        })
        .then(r => {
          console.log(r.green);
          return web();
        })
        .then(r => {
          console.log(r.green);
        })
        .catch(error => console.log(error));
  });

program.parse(process.argv);