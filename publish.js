module.exports = () => {
  const path = require("path");
  const { execSync, exec, spawn } = require('child_process');
  const { getProject } = require('./utils.js');
  const { stages } = require('./config.json');
  const webDir = path.resolve(stages[9]);
  const project = getProject();

  return new Promise((resolve, reject) => {
    const projectFolder = project.folder || project.name;
    const path = `/var/www/tour-360.ru/projects/${projectFolder}`;
    execSync(`ssh server@tour-360.ru 'mkdir -p "${path}"'`);

    const rsync = exec(`rsync --progress -ru -L --iconv=utf-8 '${webDir}/'* server@tour-360.ru:/var/www/tour-360.ru/projects/${projectFolder}`);

    rsync.stdout.on('data', function (data) {
      console.log(data.toString());
    });

    // rsync.stderr.on('data', function (data) {
    //   console.log('Error: ' + data.toString());
    // });

    rsync.on('exit', function (code) {
      if (code == 0) {
        resolve('Проект успешно опубликован')
      } else {
        reject(err);
      }
    });
  });
}
