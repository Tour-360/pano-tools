#!/usr/bin/env node

const fs = require('fs-extra')
const os = require('os');
const path = require("path");
const _ = require('lodash');
const program = require('commander');
const readlineSync = require('readline-sync');
const cliProgress = require('cli-progress');
const { execFile, exec, spawn, execSync, fork } = require('child_process');
const package = require('./package.json');

const stages = [
  // '1_Canon_CR2',
  // '2_LightRoom_TIF16',
  // '3_Enfuse_TIF16',
  // '4_PtGUI_Pano_TIF16',
  // '5_PtGUI_Nadir_TIF16',
  // '6_PtGUI_Pano_TIF16',
  // '7_Pano_JPG',
  // '8_CubePano',
  // '9_Player'
  '0_RAW',
  '1_TIFF',
  '2_HDR',
  '3_Pano',
  '4_Nadir',
  '5_Pano_Nadir',
  '6_JPG',
]

const enfuse = __dirname + '/bin/enfuse/enfuse-openmp';
const exiftool = __dirname + '/bin/exiftool/exiftool';
const photoshop =  "'/Applications/Adobe Photoshop CC 2018/Adobe Photoshop CC 2018.app'";

const bar = new cliProgress.Bar({
  format: '[{bar}] | {percentage}% | ETA: {eta}s | {info} ',
  clearOnComplete: true
}, cliProgress.Presets.rect);

program.version(package.version, '-v, --version');

program
  .command('init <name>')
  .description('Initial project, create work folder')
  .action((name) => {
    if (!fs.existsSync(name)){
      fs.mkdirSync(name);
      stages.map(folder => fs.mkdirSync(name + '/' + folder));
    } else {
      console.log('Project already exists');
    }
  })

program
  .command('start')
  .description('Start processing')
  .action(() => {


      var scCard = '/Volumes/EOS_DIGITAL/DCIM/100EOS5D/';
      var files = fs.readdirSync(scCard);
      bar.start(files.length, 0, { info: "" });
      files.map((file, key) => {
        bar.update(key, { info: file });
        const newFile = stages[0] + '/' + file;
        !fs.existsSync(newFile) && fs.copySync(scCard + file, newFile);
      });
      bar.stop();








      files = fs.readdirSync(stages[0]).filter(f => (/\.(cr2)$/i).test(f));
      var psQueue = [];
      files.map( fileName => {
        fileName = fileName.split('.')[0];
        fs.copySync(__dirname + "/templates/cameraRow/cr2_to_tiff.xmp", stages[0] + "/" + fileName + ".xmp" );
        !fs.existsSync(stages[1] + '/' + fileName + '.tif') && psQueue.push(fileName);
      });

      var options = {
        rawImport: path.resolve(stages[0]),
        rawExport: path.resolve(stages[1])
      }

      fs.writeFileSync(
        os.tmpdir()+"/pano-tools",
        Object.keys(options).map((key) => key + " " + options[key]).join("\n")
      );

      psQueue.length && execSync(`open -W ${photoshop} --args ${__dirname}/scripts/cr2_to_tif.jsx`);











      console.log(`3. Началась склейка HDR в папку ${stages[2]}`);
      files = fs.readdirSync(stages[1]).filter(f => (/\.(tif)$/i).test(f));
      var i = 0;
      bar.start(files.length, 0, { info: "" });
      const panos = _.chunk(files, 12);
      panos.map((pano, panoId) => {
        const dir = stages[2] + '/' + panoId;
        !fs.existsSync(dir) && fs.mkdirSync(dir);
        const sides = _.chunk(pano, 3);
        sides.map((side, sideId) => {
          const newFile = `${stages[2]}/${panoId}/${sideId+1}.tif`;
          bar.update(i++, { info: panoId });
          if(!fs.existsSync(newFile)){
            execSync(enfuse + " -o " + newFile + " " + side.map(i => stages[1]+"/"+i).join(" ") + " &> /dev/null");
          }
        });
      });
      bar.stop();






      console.log(`3. Началась сшифка панорам в папку ${stages[2]}`);
      const dirs = p => fs.readdirSync(p).filter(f => fs.statSync(path.join(p, f)).isDirectory())
      var newTemplate =  fs.readFileSync(__dirname + '/templates/ptgui/equidistant.pts');
      var ptguiQueue = [];
      dirs(stages[2]).map(panoName => {
        const projectFileName = path.resolve(stages[3] + `/${panoName}.pts`);
        const tiffFileName = path.resolve(stages[3] + `/${panoName}.tif`);
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
        execSync(`open '/Applications/PTGui Pro.app' -n -W --args -batch -x ${ptguiQueue.join(' ')}`);
      }








      var newTemplate =  fs.readFileSync(__dirname + '/templates/ptgui/nadir_extract.pts');
      var ptguiQueue = [];
      fs.readdirSync(stages[3]).filter(f => (/\.(tif)$/i).test(f)).map(panoName => {
        panoName = panoName.split('.')[0];

        const projectFileName = path.resolve(stages[4] + `/${panoName}.pts`);
        const tiffFileName = path.resolve(stages[4] + `/${panoName}.tif`);

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








      fs.readdirSync(stages[4]).filter(f => (/\.(tif)$/i).test(f));
      psQueue = [];
      files.map( fileName => {
        fileName = fileName.split('.')[0];
        !fs.existsSync(stages[4] + '/' + fileName + '.tif') && psQueue.push(fileName);
      });

      options = {
        nadirImport: path.resolve(stages[4])
      }

      fs.writeFileSync(
        // todo: вынести это в отдельную функцию работы с файлом
        os.tmpdir()+"/pano-tools",
        Object.keys(options).map((key) => key + " " + options[key]).join("\n")
      );

      psQueue.length && execSync(`open -W ${photoshop} --args ${__dirname}/scripts/nadir_fill.jsx`);












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
        // fs.copySync(__dirname + "/templates/cameraRow/pano_standart.xmp", stages[5] + "/" + fileName + ".xmp" );
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





  })

program.parse(process.argv);
