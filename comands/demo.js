const fs = require('fs');
const { execSync } = require('child_process');
const path = require("path");
const filesize = require("filesize");
const { files, bar, getProject, notification } = require('../utils.js');
const { stages, execs } = require('../config.json');
const exiftool = path.resolve(__dirname, execs.exiftool);
const rowDir = path.resolve(stages[0]);
const jpegDir = path.resolve(stages[6]);
const webDir = path.resolve(stages[9]);


exports.command = 'demo [options]'
exports.desc = 'Создания страницы демонстрации проекта'
exports.builder = {
  name: {
    alias: 'n',
    desc: "project name",
  },
  google: {
    alias: 'g',
    desc: 'url on google map iFrame'
  }
}

exports.handler = (options) => {
  const project = getProject();
  const projectName = options.name || project.name || path.basename(path.resolve());
  const projectDir = path.resolve(webDir);
  const demoPagePath = path.resolve(projectDir + '/demo.html');

  const panoAmount = files(jpegDir).length;

  let shotDate = '-';

  try {
    const rowFilePath = path.resolve( rowDir , files(rowDir)[0]);
    shotDate = execSync(`${exiftool} '${rowFilePath}' -ExifIFD:DateTimeOriginal`)
      .toString('utf8')
      .split(': ')[1]
      .split(' ')[0]
      .replace(/\:/g, '.');

  } catch (e) {}

  const date = new Date();

  publishDate = [date.getFullYear(),
    date.getMonth()+1,
    date.getDate()].join('.');


  const zipPanoramsPath = path.resolve(projectDir + '/panorams.zip');
  if(!fs.existsSync(zipPanoramsPath)) {
    execSync(`zip -rj '${webDir}/panorams.zip' '${jpegDir}'`);
  }
  const zipPanoramsSize = filesize(fs.statSync(zipPanoramsPath).size);



  const zipTourPath = path.resolve(projectDir + '/tour.zip');
  if(!fs.existsSync(zipTourPath)) {
    execSync(`cd '${webDir}' && zip -r tour.zip ./ -x ./*.zip -x demo.html`);
  }
  const zipTourSize = filesize(fs.statSync(zipTourPath).size);

  if(!fs.existsSync(demoPagePath)) {
    !fs.existsSync(webDir) && reject('Каталог ' + webDir + ' не создан');

    const iframeUrl = options.google || '//tour-360.ru/projects/' + (project.folder || project.name) + '/';

    const page = fs.readFileSync(path.resolve(__dirname, '../templates/demonstration/demonstration.html'));

    fs.writeFileSync(
      demoPagePath,
      page.toString('utf8')
        .replace(/PROJECT_NAME/g, projectName)
        .replace(/IFRAME_URL/g, options.google ? iframeUrl : 'index.html')
        .replace(/CODE_URL/g, iframeUrl)
        .replace(/SHOT_DATE/g, shotDate)
        .replace(/PUBLISH_DATE/g, publishDate)
        .replace(/ZIP_PANORAMS_SIZE/g, zipPanoramsSize)
        .replace(/ZIP_TOUR_SIZE/g, zipTourSize)
        .replace(/ZIP_PANORAMS/g, 'panorams.zip')
        .replace(/ZIP_TOUR/g, 'tour.zip')
        .replace(/PANO_AMOUNT/g, panoAmount)
    );

    notification.success("Файл demo.html успешно создан")
  } else {
    notification.warning('Файл demo.html уже существует');
  }
};
