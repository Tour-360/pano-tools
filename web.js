

module.exports = () => {
  const fs = require('fs');
  const fse = require('fs-extra');
  const path = require("path");
  const { dirs, bar, getProject } = require('./utils.js');
  const { stages, execs } = require('./config.json');
  const project = getProject();
  const projectDirName = path.basename(path.resolve());
  const projectName = project.name || /\(([^)]+)\)/.exec(projectDirName)?.[1] ||
    projectDirName.split('_').splice(-1)[0];
  const playerDir = path.resolve(stages[8]);
  const webDir = path.resolve(stages[9]);
  const projectDir = path.resolve(webDir);

  const indexPagePath = path.resolve(projectDir + '/index.html');

  const manifest = {
    panorams: [],
    name: projectName,
    floors: [
      {
        height: 300,
        title: "First floor",
        plan: null
      }
    ]
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

      const playerDirs = dirs(playerDir);

      playerDirs.map(panoName => {
        manifest.panorams.push({
          id: panoName,
          title: panoName,
          heading: 0,
          markers: []
        });
      });

      if (playerDirs.lenght) {
        manifest.start = playerDirs[0];
      }

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
