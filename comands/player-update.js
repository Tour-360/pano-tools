const { files, bar } = require('../utils.js');
const fse = require('fs-extra');
const { JSDOM } = require("jsdom");
const path = require("path");
const { notification } = require('../utils');
const { stages, presets, execs } = require('../config.json');
const ftp = require("basic-ftp");


exports.command = 'player-update';
exports.desc = 'Обновление верисии плеера на актуальную';
exports.builder = {
  path: {
    alias: 'p',
    desc: 'File path'
  }
};


exports.handler = async ({ path: indexPath }) => {
    const webDir = path.resolve(stages[9]);
    if (!indexPath) {
      indexPath = path.resolve(webDir, 'index.html');
    }

    try {
      const client = new ftp.Client();
      await client.access({ host: 'tour-360.ru' });
      const versionList = (await client.list('/tour-player'))
        .map(f => f.name)
        .filter(f => /([0-9]*)\.([0-9]*)\.([0-9]*)/.test(f));

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
      if (document) {

        const css = document.querySelector('link[rel="stylesheet"][href$="tour-player.css"]');
        const script = document.querySelector('script[src$="tour-player.js"]');


        const oldPath = script.src.split('/');
        const oldVersion = oldPath[oldPath.length - 2];

        css.href = `libs/tour-player/${latest}/tour-player.css`;
        script.src = `libs/tour-player/${latest}/tour-player.js`;

        fse.writeFileSync(
          indexPath,
          dom.serialize()
        );

        notification.success(`Update tour-player ${oldVersion} -> ${latest}`);

      } else {
        notification.error('Ошибка парсинга html');
      }

    } catch (e) {
      notification.error('Ошибка получения файлов плеера с сервера');
      throw e;
    }
}


