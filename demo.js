const fs = require('fs');
const { execSync } = require('child_process');
const path = require("path");
const filesize = require("filesize");
const { files, bar } = require('./utils.js');
const { stages, execs } = require('./config.json');
const projectName = path.basename(path.resolve());

const exiftool = path.resolve(__dirname, execs.exiftool);


const rowDir = path.resolve(stages[0]);
const jpegDir = path.resolve(stages[6]);
const webDir = path.resolve(stages[9]);

const projectDir = path.resolve(webDir, projectName);

const demoPagePath = path.resolve(projectDir + '/demonstration.html');

module.exports = () => {
  return new Promise((resolve, reject) => {

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
    execSync(`zip -rj '${webDir}/${projectName}/panorams.zip' '${jpegDir}'`);
  }
  const zipPanoramsSize = filesize(fs.statSync(zipPanoramsPath).size);



  const zipTourPath = path.resolve(projectDir + '/tour.zip');
  if(!fs.existsSync(zipTourPath)) {
    execSync(`cd '${webDir}/${projectName}' && zip -r tour.zip ./ -x ./*.zip -x demonstration.html`);
  }
  const zipTourSize = filesize(fs.statSync(zipTourPath).size);

  if(!fs.existsSync(demoPagePath)) {
    !fs.existsSync(webDir) && reject('Каталог ' + webDir + ' не создан');

    const page = fs.readFileSync(__dirname + '/templates/demonstration/demonstration.html')

    fs.writeFileSync(
    demoPagePath,
    page.toString('utf8')
      .replace(/PROJECT_NAME/g, projectName)
      .replace(/SHOT_DATE/g, shotDate)
      .replace(/PUBLISH_DATE/g, publishDate)
      .replace(/ZIP_PANORAMS_SIZE/g, zipPanoramsSize)
      .replace(/ZIP_TOUR_SIZE/g, zipTourSize)
      .replace(/ZIP_PANORAMS/g, 'panorams.zip')
      .replace(/ZIP_TOUR/g, 'tour.zip')
      .replace(/PANO_AMOUNT/g, panoAmount)
    );

    resolve("Файл demonstration.html успешно создан")
  } else {
    reject('Файл demonstration.html уже существует');
  }
  });
}
