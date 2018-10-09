#!/usr/bin/env node
const fs = require('fs-extra');
const path = require("path");
const os = require('os');
var colors = require('colors');
const _ = require('lodash');
const program = require('commander');
const readlineSync = require('readline-sync');
const cliProgress = require('cli-progress');
const { execFile, exec, spawn, execSync, fork } = require('child_process');
const package = require('./package.json');
var chokidar = require('chokidar');


const importRow = require('./import.js');
const prepare = require('./prepare.js');
const hdr = require('./hdr.js');


const stages = [
  '0_RAW',
  '1_TIFF',
  '2_HDR',
  '3_Pano',
  '4_Nadir',
  '5_Pano_Nadir',
  '6_JPG',
  '7_Cube',
  '8_Player',
  '9_Web'
]

const enfuse = __dirname + '/bin/enfuse/enfuse-openmp';
const exiftool = __dirname + '/bin/exiftool/exiftool';
const photoshop =  "'/Applications/Adobe Photoshop CC 2018/Adobe Photoshop CC 2018.app'";

const bar = new cliProgress.Bar({
  format: '[{bar}] | {percentage}% | ETA: {eta}s | {info} ',
  clearOnComplete: true
}, cliProgress.Presets.rect);


const dirs = p => fs.readdirSync(p).filter(f => fs.statSync(path.join(p, f)).isDirectory())


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
        console.log("Импорт фотографий успешно завершен.".yellow);
      });
  });


program
  .command('prepare')
  .description('Подготовка фотографий к работе, конвертация RAW файлов')
  .action(() => {
      prepare().then(r => {
        console.log("RAW файлы успешно обработанны.".yellow);
      }).catch(console.error);
  });

program
  .command('hdr')
  .description('Объединение снимков в HDR.')
  .action(() => {
      hdr().then(r => {
        console.log("Объединение снимков в HDR успешно завершено.".yellow)
      }).catch(console.error);
  });

// program
//   .command('watch')
//   .description('Импорт файлов с внешнего устройства')
//   .action(() => {
//       chokidar.watch(stages[1], {ignored: /(^|[\/\\])\../}).on('all', (event, path) => {
//         console.log(event, path);
//       });
//   });


program
  .command('start')
  .description('Start processing')
  .action(() => {

      importRow()
        .then(() => {
          console.log("Импорт файлов успешно завершен.".yellow);
          return prepare();
        })
        .then(() => {
          console.log("Обработка RAW успешно завершена.".yellow);
          return hdr();
        })
        .then(() => {
          console.log("Объединение снимков в HDR успешно завершено.".yellow);
        });
  });


program
  .command('other')
  .description('Остальное')
  .action(() => {
      // console.log(`3. Началась сшифка панорам в папку ${stages[2]}`);
      // var newTemplate =  fs.readFileSync(__dirname + '/templates/ptgui/equidistant.pts');
      // var ptguiQueue = [];
      // dirs(stages[2]).map(panoName => {
      //   const projectFileName = path.resolve(stages[3] + `/${panoName}.pts`);
      //   const tiffFileName = path.resolve(stages[3] + `/${panoName}.tif`);
      //   if (!fs.existsSync(projectFileName)){
      //     fs.writeFileSync(
      //       projectFileName,
      //       newTemplate.toString('utf8').replace(/pano_name/g, panoName)
      //     );
      //   }

      //   if (!fs.existsSync(tiffFileName)){
      //     ptguiQueue.push(projectFileName);
      //   }
      // });

      // if (ptguiQueue.length){
      //   execSync(`open '/Applications/PTGui Pro.app' -n -W --args -batch -x ${ptguiQueue.join(' ')}`);
      // }








      // var newTemplate =  fs.readFileSync(__dirname + '/templates/ptgui/nadir_extract.pts');
      // var ptguiQueue = [];
      // fs.readdirSync(stages[3]).filter(f => (/\.(tif)$/i).test(f)).map(panoName => {
      //   panoName = panoName.split('.')[0];

      //   const projectFileName = path.resolve(stages[4] + `/${panoName}.pts`);
      //   const tiffFileName = path.resolve(stages[4] + `/${panoName}.tif`);

      //   if (!fs.existsSync(projectFileName)){
      //     fs.writeFileSync(
      //       projectFileName,
      //       newTemplate.toString('utf8').replace(/pano_name/g, panoName)
      //     );
      //   }

      //   if (!fs.existsSync(tiffFileName)){
      //     ptguiQueue.push(projectFileName);
      //   }
      // });

      // if (ptguiQueue.length){
      //   execSync(`open '/Applications/PTGui Pro.app' -n -W --args -batch -d -x ${ptguiQueue.join(' ')}`);
      // }








      // let files = fs.readdirSync(stages[4]).filter(f => (/\.(tif)$/i).test(f));
      // psQueue = [];
      // files.map( fileName => {
      //   fileName = fileName.split('.')[0];
      //   // !fs.existsSync(stages[4] + '/' + fileName + '.tif') && psQueue.push(fileName);
      //   psQueue.push(fileName);
      // });
      // options = {
      //   nadirImport: path.resolve(stages[4])
      // }
      // fs.writeFileSync(
      //   // todo: вынести это в отдельную функцию работы с файлом
      //   os.tmpdir()+"/pano-tools",
      //   Object.keys(options).map((key) => key + " " + options[key]).join("\n")
      // );


      // psQueue.length && execSync(`open -W ${photoshop} --args ${__dirname}/scripts/nadir_fill.jsx`);






      var newTemplate =  fs.readFileSync(__dirname + '/templates/ptgui/nadir_insert.pts');
      var ptguiQueue = [];
      fs.readdirSync(stages[4]).filter(f => (/\.(tif)$/i).test(f)).map(panoName => {
        panoName = panoName.split('.')[0];

        const projectFileName = path.resolve(stages[4] + `/${panoName}.pts`);
        const tiffFileName = path.resolve(stages[5] + `/${panoName}.tif`);

        if (!fs.existsSync(projectFileName)){
          fs.writeFileSync(
            projectFileName,
            newTemplate.toString('utf8').replace(/pano_name/g, panoName)
          );
        }

        if (!fs.existsSync(tiffFileName)){
          ptguiQueue.push(projectFileName);
        }
      });

      if (ptguiQueue.length){
        execSync(`open '/Applications/PTGui Pro.app' -n -W --args -batch -d -x ${ptguiQueue.join(' ')}`);
      }










      execSync(`${exiftool} -tagsfromfile ${__dirname + "/templates/cameraRow/pano_standart.xmp"} -all:all ./${stages[5]}/*.tif -overwrite_original`)

      files = fs.readdirSync(stages[5]).filter(f => (/\.(tif)$/i).test(f));
      var psQueue = [];
      files.map( fileName => {
        fileName = fileName.split('.')[0];
        !fs.existsSync(stages[1] + '/' + fileName + '.jpg') && psQueue.push(fileName);
      });

      var options = {
        panoImport: path.resolve(stages[5]),
        panoExport: path.resolve(stages[6])
      }

      fs.writeFileSync(
        os.tmpdir()+"/pano-tools",
        Object.keys(options).map((key) => key + " " + options[key]).join("\n")
      );

      psQueue.length && execSync(`open -W ${photoshop} --args ${__dirname}/scripts/pano_to_jpeg.jsx`);











      ptguiQueue = [];
      var panoFiles = [];
      fs.readdirSync(stages[6]).filter(f => (/\.(jpg)$/i).test(f)).map(panoName => {
        panoName = panoName.split('.')[0];
        panoFolder = stages[7] + '/' + panoName;
        if (!fs.existsSync(panoFolder)){
          fs.mkdirSync(panoFolder);
          panoFile = `${panoFolder}/pano.jpg`;
          panoFiles.push(panoFile);
          fs.copySync(`${stages[6]}/${panoName}.jpg`, panoFile);
          for (var i = 0; i < 6; i ++) {
            var ptsPath = path.resolve(panoFolder + "/" + i + ".pts");
            fs.copySync(__dirname + "/templates/ptgui/cube/"+i+".pts", ptsPath );
            ptguiQueue.push(ptsPath);
          }
        }
      });
      if (ptguiQueue.length){
        execSync(`open '/Applications/PTGui Pro.app' -n -W --args -batch -d -x ${ptguiQueue.join(' ')}`);
        panoFiles.map(panoFile => {
          fs.unlink(panoFile);
        })
      }





      playerDir = stages[8];
      dirs(stages[7]).map(panoName => {
        panoFolder = playerDir + "/" + panoName;
        if (!fs.existsSync(panoFolder)){
          fs.mkdirSync(playerDir + "/" + panoName);
          [
            { folder: "low", size: "1024x1024", quality: "60" },
            { folder: "standard", size: "2048x2048", quality: "85" },
            { folder: "thumbnail", size: "256x128", quality: "70" }
          ].map(p => {
            var folder = panoFolder + "/" + p.folder;
            fs.mkdirSync(folder);
            if (p.folder == "thumbnail" ){
                execSync(`convert -resize ${p.size} -quality ${p.quality} -format jpg ${stages[6]}/${panoName}.jpg ${folder}/mini.jpg`);
                console.log('.');
            } else {
              for (var i = 0; i < 6; i ++) {
                execSync(`convert -resize ${p.size} -quality ${p.quality} -format jpg ${stages[7]}/${panoName}/${i}.jpg ${folder}/${i}.jpg`);
                console.log('.');
              }
            }
          })

          execSync(`montage -mode concatenate -tile 6x -resize 128x -quality 30 -format jpg ${stages[7]}/${panoName}/*.jpg ${panoFolder}/thumbnail/0.jpg`);

        }
      });




      // ======


      // indexPagePath = path.resolve(stages[9] + '/index.html');
      // const projectName = path.basename(path.resolve());
      // if(!fs.existsSync(indexPagePath)) {
      //   fs.symlinkSync(path.resolve(stages[8]), stages[9] + '/panorams');

      //   var indexPage = fs.readFileSync(__dirname + '/templates/tour-player/index.html');
      //   fs.writeFileSync(
      //     indexPagePath,
      //     indexPage.toString('utf8').replace(/PROJECT_NAME/g, projectName)
      //   );


      //   const manifest = {
      //     panorams: []
      //   }
      //   dirs(stages[8]).map(panoName => {
      //     manifest.panorams.push({
      //       id: panoName,
      //       title: panoName,
      //       heading: 0,
      //       markers: []
      //     });
      //   });

      //   fs.writeFileSync(stages[9] + '/manifest.json', JSON.stringify(manifest, null, 2));
      //   fs.writeFileSync(stages[9] + '/sftp-config.json', JSON.stringify({
      //     "type": "sftp",
      //     "upload_on_save": true,
      //     "host": "tour-360.ru",
      //     "user": "server",
      //     "password": "",
      //     "remote_path": "/var/www/tour-360.ru/",
      //     "ignore_regexes": [
      //         "sftp-config(-alt\\d?)?\\.json",
      //         "sftp-settings\\.json",
      //         "\\.git/",
      //         "\\.DS_Store"
      //     ],
      //   }, null, 2));
      // }
  });

program.parse(process.argv);
