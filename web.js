

module.exports = () => {
  const fs = require('fs');
  const fse = require('fs-extra');
  const path = require("path");
  const { dirs, bar, getProject } = require('./utils.js');
  const { stages, execs } = require('./config.json');
  const project = getProject();
  const projectName = project.name || path.basename(path.resolve());
  const playerDir = path.resolve(stages[8]);
  const webDir = path.resolve(stages[9]);
  const projectDir = path.resolve(webDir);

  const indexPagePath = path.resolve(projectDir + '/index.html');

  const manifest = {
    panorams: []
  }

  return new Promise((resolve, reject) => {
    if (!fs.existsSync(indexPagePath)) {
      // !fs.existsSync(webDir) && fs.mkdirSync(webDir);


      fse.copySync(path.resolve(__dirname, 'templates/tour-player/'), projectDir);
      fs.symlinkSync(path.resolve(playerDir), projectDir + '/panorams');
      // !fs.existsSync(projectDir) && fs.mkdirSync(projectDir);

      const indexPage = fs.readFileSync(__dirname + '/templates/tour-player/index.html')
        .toString('utf8').replace(/PROJECT_NAME/g, projectName);

      fs.writeFileSync(
        indexPagePath,
        indexPage
      );

      dirs(playerDir).map(panoName => {
        manifest.panorams.push({
          id: panoName,
          title: panoName,
          heading: 0,
          markers: []
        });
      });

      fs.writeFileSync(projectDir + '/tour.json', JSON.stringify(manifest, null, 2));

      // fs.writeFileSync(webDir + '/sftp-config.json', JSON.stringify({
      //   "type": "sftp",
      //   "upload_on_save": true,
      //   "host": "tour-360.ru",
      //   "user": "server",
      //   "password": "",
      //   "remote_path": "/var/www/tour-360.ru/projects",
      //   "ignore_regexes": [
      //       "sftp-config(-alt\\d?)?\\.json",
      //       "sftp-settings\\.json",
      //       "\\.git/",
      //       "\\.DS_Store"
      //   ],
      // }, null, 2));
      resolve("Версия для веба успешно создана")
    } else {
      resolve("Версия для веба уже существует")
    }
  });
}
