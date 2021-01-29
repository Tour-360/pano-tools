const fs = require('fs');
const ftp = require("basic-ftp");
const fse = require('fs-extra');
const Spinner = require('cli-spinner').Spinner;
const path = require("path");
const { dirs, bar, getProject, notification } = require('../utils.js');
const { stages, execs } = require('../config.json');

exports.comand = 'web';
exports.desc = 'Компоновка виртуального тура для веб';

exports.handler = async () => {
  const spinner = new Spinner(`-`);
  spinner.setSpinnerString(18);
  spinner.start();

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

  if (!fs.existsSync(indexPagePath)) {


    !fs.existsSync(projectDir) && fs.mkdirSync(projectDir);

    fse.copySync(path.resolve(__dirname, '../templates/web/'), projectDir);

    fs.symlinkSync(path.resolve(playerDir), path.resolve(projectDir, 'panorams'));

    try {
      spinner.text = `Получения номера последней версии tour-player`;

      const client = new ftp.Client()
      await client.access({ host: 'tour-360.ru' });
      const versionList = (await client.list('/tour-player'))
        .map(f => f.name)
        .filter(f => /([0-9]*)\.([0-9]*)\.([0-9]*)/.test(f));

      const latest = versionList[versionList.length - 1];

      spinner.text = `Загрузка Tour-player ${('v'+latest.bold).bold.yellow}`;
      const tourPlayerDir = path.resolve(projectDir, 'libs', 'tour-player', latest);
      fse.ensureDirSync(tourPlayerDir);
      await client.downloadToDir(tourPlayerDir, `/tour-player/${latest}`);
      await client.close();


      spinner.text = `Создание веб-страниц и стилей и скриптов`;
      const indexPage = fs.readFileSync(path.resolve(__dirname + '/../templates/web/index.html'))
        .toString('utf8')
        .replace(/PROJECT_NAME/g, projectName)
        .replace(/PLAYER_VERSION/g, latest);

      fs.writeFileSync(
        indexPagePath,
        indexPage
      );


    } catch (e) {
      spinner.stop(true);
      notification.error("Ошибка получения файлов плеера с сервера");
      throw e;
    }

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

    spinner.stop(true);
    notification.success("Версия для веба успешно создана");
  } else {
    spinner.stop(true);
    notification.warning("Версия для веба уже существует");
  }
};