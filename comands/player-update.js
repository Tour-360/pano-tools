const semverSort = require('semver-sort');
const semverDiff = require('semver-diff');
const semverValid = require('semver/functions/valid')

const { files, bar } = require('../utils.js');
const fse = require('fs-extra');
const { JSDOM } = require("jsdom");
const path = require("path");
const { notification } = require('../utils');
const { stages, presets, execs } = require('../config.json');
const ftp = require("basic-ftp");
const webDir = path.resolve(stages[9]);

exports.command = 'player-update';
exports.desc = 'Обновление верисии плеера на актуальную';
exports.builder = {
  file: {
    alias: 'f',
    default: `${webDir}/index.html`,
    desc: 'HTML file path'
  },
  diff: {
    alias: 'd',
    default: 'minor',
    desc: 'Difference semver'
  }
};


exports.handler = async ({ file: indexPath, diff }) => {
    if (!indexPath) {
      indexPath = path.resolve(webDir);
    }

    const html = fse.readFileSync(indexPath).toString('utf8');
    const dom = new JSDOM(html);
    const document = dom?.window?.document;

    if (document) {

      const css = document.querySelector('link[rel="stylesheet"][href$="tour-player.css"]');
      const script = document.querySelector('script[src$="tour-player.js"]');


      const oldPath = script.src.split('/');
      const oldVersion = oldPath[oldPath.length - 2];

      const semver = {
        major: ['release', 'prerelease', 'major', 'premajor', 'minor', 'preminor', 'patch', 'prepatch', 'build'],
        minor: ['minor', 'preminor', 'patch', 'prepatch', 'build'],
        patch: ['patch', 'prepatch', 'build'],
      }

      try {
        const client = new ftp.Client();
        await client.access({ host: 'tour-360.ru' });
        const versionList = semverSort.asc(
          (await client.list('/tour-player'))
            .map(f => f.name)
            .filter(newVersion =>
              semverValid(oldVersion) &&
              semverValid(newVersion) &&
              semver[diff].includes(semverDiff(oldVersion, newVersion))
              || oldVersion === newVersion
            )
        );

        if (!versionList.length) {
          await notification.warning('Нет доступных версий для обьновленияю Возможно вы хотите сделать мажорное обновление (pt player-update -f major)')
          process.exit(0);
        }

        const latest = versionList[versionList.length - 1];

        notification.info(`Download Tour-player v${latest}`);
        const tourPlayerDir = path.resolve(webDir, 'libs', 'tour-player', latest);
        fse.ensureDirSync(tourPlayerDir);
        await client.downloadToDir(tourPlayerDir, `/tour-player/${latest}`);
        await client.close();

        notification.info(`Обновление ссылок на файл плеера в файле ${indexPath}`);

        const html = fse.readFileSync(indexPath).toString('utf8');

        const dom = new JSDOM(html);
        const document = dom?.window?.document;


        css.href = `libs/tour-player/${latest}/tour-player.css`;
        script.src = `libs/tour-player/${latest}/tour-player.js`;

        fse.writeFileSync(
          indexPath,
          dom.serialize()
        );

        notification.success(`Update tour-player ${oldVersion} -> ${latest}`);

      } catch (e) {
        notification.error('Ошибка получения файлов плеера с сервера');
        throw e;
      }


    } else {
      notification.error('Ошибка парсинга html');
    }
}


