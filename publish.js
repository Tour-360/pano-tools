module.exports = () => {
  const scp = require('scp');
  const path = require("path");
  const { execSync, exec } = require('child_process');
  const { getProject } = require('./utils.js');
  const { stages } = require('./config.json');
  const webDir = path.resolve(stages[9]);
  const project = getProject();

  return new Promise((resolve, reject) => {
    const projectFolder = project.folder || project.name;
    const path = `/var/www/tour-360.ru/projects/${projectFolder}`;
    execSync(`ssh server@tour-360.ru 'mkdir -p "${path}"'`);
    exec(`scp -r -P 22 '${webDir}/'* server@tour-360.ru:/var/www/tour-360.ru/projects/${projectFolder}`, err => {
      if(!err) resolve('Проект успешно опубликован');
      else reject(err);
    });
  });
}
