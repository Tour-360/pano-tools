#!/usr/bin/env node
const fs = require('fs');
const path = require("path");
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
const demo = require('./demo.js');
const exif = require('./exif.js');
const video = require('./video.js');
const playerOptim = require('./optim.js');
const deleteDirs = require('./delete.js');
const youtube = require('./youtube.js');
const serve = require('./serve.js');
const publish = require('./publish.js');

const { stages, execs } = require('./config.json');


program.version(package.version, '-v, --version');

program
  .command('init [name]')
  .option('-n, --name [name]', 'Project name')
  .option('-f, --folder [folder]', 'Folder name')
  .description('Инициализация проекта, создание рабочей директории')
  .action((name, cmd) => {
    projectJson = JSON.stringify({
      name: name || cmd.name,
      folder: cmd.folder
    }, null, 2);

    if (name) {
      if (!fs.existsSync(name)){
        fs.mkdirSync(name);
        stages.map(folder => fs.mkdirSync(name + '/' + folder));
        console.log("Каталог проекта создан".green)
      } else {
        console.log('Проект уже существует'.green);
        fs.writeFileSync(path.resolve(name, 'project.json'), projectJson);
      }
    } else {
      stages.map(folder => {
        !fs.existsSync(folder) && fs.mkdirSync(folder);
        fs.writeFileSync('project.json', projectJson);
      });
      console.log("Каталоги созданы".green)
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
  .command('player-optim')
  .description('Оптимизация изображений веб-плеера')
  .action(() => {
      playerOptim().then(r => {
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
  .command('demo')
  .option('-n, --name [name]', 'Project name')
  .option('-g, --google [google]', 'url on google map iFrame')
  .description('Создания страницы демонстрации проекта')
  .action((cmd) => {
      demo({
        name: (typeof cmd.name == 'string' && cmd.name),
        google: cmd.google
      }).then(r => {
        console.log(r.green);
      }).catch(console.error);
  });

program
  .command('exif')
  .description('Вшивание exif в jpeg файлы')
  .action(() => {
      exif().then(r => {
        console.log(r.green);
      }).catch(console.error);
  });

program
  .command('youtube')
  .description('Создание видео для YouTube')
  .action(() => {
      youtube().then(r => {
        console.log(r.green);
      }).catch(console.error);
  });

program
  .command('serve')
  .option('-o, --open', 'Open in browser')
  .option('-p, --port [port]', 'Port, default: 8080')
  .description('Запуск сервера для разработки')
  .action((cmd) => {
      serve({
        port: cmd.port || 8080,
        open: cmd.open
      }).then(r => {
        console.log(r.green);
      }).catch(console.error);
  });

program
  .command('publish')
  .description('Публикация проекта на сервере')
  .action(() => {
      publish().then(r => {
        console.log(r.green);
      }).catch(console.error);
  });

program
  .command('video <file>')
  .option('-w, --width [value]', 'Width (default - 1080)')
  .option('-h, --height [value]', 'Height (default - 1920)')
  .option('-t, --time [value]', 'Time in seconds (default - 8)')
  .option('-f, --fps [value]', 'Frame per second (default - 30)')
  .option('-s, --start [value]', 'Start point (default - 0)')
  .option('-e, --end [value]', 'End point (default - 360)')
  .description('Создание видео из панорамы')
  .action((file, cmd) => {
      video(file, {
        height: (cmd.height || 1920 ),
        width: (cmd.width || 1080 ),
        time: (cmd.time || 8 ),
        fps: (cmd.fps || 30 ),
        start: (cmd.start || 0 ),
        end: (cmd.end || 360 )
      }).then(r => {
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
  .option('-y, --yes', 'Пропустить все вопросы')
  .description('Все этапы обработки кроме импорта')
  .action((cmd) => {
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
          return !cmd.yes ? inquirer.prompt({
            type: "confirm",
            name: "fill",
            message: 'Ретушировать надиры?',
            default: false
          }).then( ({fill}) => {
            return (fill ? nadirFill() : false);
          }) : nadirFill();
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
          return exif();
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
          return playerOptim();
        })
        .then(r => {
          console.log(r.green);
          return web();
        })
        .then(r => {
          console.log(r.green);
          return demo();
        })
        .then(r => {
          console.log(r.green);
        })
        .catch(error => console.log(error));
  });

program
  .command('*')
  .action(() => {
    console.log('Не верно введена команда'.red);
  })

program.parse(process.argv);


if(program.args.length === 0) {
  program.help();
}
