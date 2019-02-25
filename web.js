const fs = require('fs');
const path = require("path");
const { dirs, bar } = require('./utils.js');
const { stages, execs } = require('./config.json');
const projectName = path.basename(path.resolve());
const playerDir = path.resolve(stages[8]);
const webDir = path.resolve(stages[9]);
const projectDir = path.resolve(webDir, projectName);

const indexPagePath = path.resolve(projectDir + '/index.html');

const manifest = {
  panorams: []
}


module.exports = () => {
  return new Promise((resolve, reject) => {
    if(!fs.existsSync(indexPagePath)) {
      !fs.existsSync(webDir) && fs.mkdirSync(webDir);
      !fs.existsSync(projectDir) && fs.mkdirSync(projectDir);

      fs.symlinkSync(path.resolve(playerDir), projectDir + '/panorams');
      const indexPage = fs.readFileSync(__dirname + '/templates/tour-player/index.html')
        .toString('utf8').replace(/PROJECT_NAME/g, projectName);

      fs.writeFileSync(
        indexPagePath,
        indexPage.toString('utf8').replace(/PROJECT_NAME/g, projectName)
      );

      dirs(playerDir).map(panoName => {
        manifest.panorams.push({
          id: panoName,
          title: panoName,
          heading: 0,
          markers: []
        });
      });

      fs.writeFileSync(projectDir + '/manifest.json', JSON.stringify(manifest, null, 2));

      fs.writeFileSync(webDir + '/sftp-config.json', JSON.stringify({
        "type": "sftp",
        "upload_on_save": true,
        "host": "tour-360.ru",
        "user": "server",
        "password": "",
        "remote_path": "/var/www/tour-360.ru/projects",
        "ignore_regexes": [
            "sftp-config(-alt\\d?)?\\.json",
            "sftp-settings\\.json",
            "\\.git/",
            "\\.DS_Store"
        ],
      }, null, 2));

      resolve("Версия для веба успешно создана")

    } else {
      resolve("Версия для веба уже существует")
    }
  });
}
