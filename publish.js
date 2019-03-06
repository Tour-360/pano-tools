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
    execSync(`ssh server@tour-360.ru 'mkdir -p ${path}'`);
    scp.send({
      file: webDir + '/*',
      user: 'server',
      host: 'tour-360.ru',
      path: path
    }, function (err) {
      if (err) reject(err);
      else {
        exec('open http://tour-360.ru/projects/' + projectFolder);
        resolve('Проект успешно опубликован');
      }
    });
  });
}
