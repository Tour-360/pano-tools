module.exports = ({open}) => {
  const path = require("path");
  const { execSync, exec, spawn } = require('child_process');
  const { getProject } = require('./utils.js');
  const { stages } = require('./config.json');
  const webDir = path.resolve(stages[9]);
  const project = getProject();

  return new Promise((resolve, reject) => {
    const projectFolder = project.folder || project.name;
    const rsync = exec(`rsync --progress -ru -L '${webDir}/'* server@tour-360.ru:/var/www/tour-360.ru/projects/${projectFolder}`);

    rsync.stdout.on('data', function (data) {
      console.log(data.toString());
    });

    rsync.on('exit', function (code, message) {
      if (code == 0) {
        const url = `https://tour-360.ru/projects/${projectFolder}`;
        resolve(`Проект доступен по ссылке: ${url}`);
        open && exec('open ' + url);
      } else {
        console.log('Error:', code, message);
        reject(code, message);
      }
    });
  });
}
