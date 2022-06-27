const path = require("path");
const fs = require("fs");
const { execSync, exec, spawn } = require('child_process');
const { getProject, bar, notification } = require('../utils.js');
const { stages } = require('../config.json');
const Spinner = require('cli-spinner').Spinner;
const glob = require('glob-promise');
exports.comand = 'publish';
exports.desc = 'Публикация проекта на сервере';
exports.builder = {
  open: {
    alias: 'o',
    desc: 'Open in browser',
    type: 'boolean',
    default: false
  },
  display: {
    alias: 'd',
    desc: 'Display rsync response',
    type: 'boolean',
    default: false
  }
};

exports.handler = async ({open, display}) => {
  const webDir = path.resolve(stages[9]);
  const project = getProject();

  const spinner = new Spinner(`Получение списка файлов для публикации`);
  spinner.setSpinnerString(18);
  !display && spinner.start();

  const projectFolder = project.folder || project.name;

  const files = (await glob(path.resolve(webDir, '**', '*'), {
    nodir: true, follow: true
  })).reduce((acc,curr)=> (acc[curr]=fs.statSync(curr).size, acc),{});

  const totalSize = Object.values(files).reduce((a, b) => a + b);

  spinner.stop(true);

  const rsync = exec(`rsync --progress -ru -L '${webDir}/'* server@tour-360.ru:/var/www/tour-360.ru/projects/${projectFolder}`);
  spinner.stop(true);

  let uploading = false;

  rsync.stdout.on('data', (data) => {

    if (!display) {
      if (data.toString().includes('sending incremental file list')) {
        spinner.text = 'Анализ измененных файлов на сервере';
        spinner.start(true);
      } else {
        if (!uploading) {
          uploading = true;
          bar.start(totalSize);
          spinner.stop(true);
        }

        data.toString()
          .split('\n')
          .filter(r => !r.includes('\r') && r !== '')
          .forEach(f => {
            delete files[path.resolve(webDir, f)];
            bar.update(totalSize - (Object.values(files).length ? Object.values(files).reduce((a, b) => a + b): 0));
          });
      }
    } else {
      spinner.stop(true);
      console.log(data.toString());
    }
  });

  rsync.on('exit', (code, message) => {
    spinner.stop(true);
    bar.stop();
    if (code === 0) {
      const url = `https://tour-360.ru/projects/${projectFolder}`;
      notification.success(`Проект доступен по ссылке: ${url}`);
      open && exec('open ' + url);
    } else if(code == 12){
      notification.error('Недостаточно места на диске');
    } else {
      notification.error(['Error:', code, message].join(' '));
      process.exit(1);
    }
  });
}
