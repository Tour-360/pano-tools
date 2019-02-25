const { exec } = require('child_process');
const path = require("path");
const { stages, execs } = require('./config.json');
const express = require('express')
const webDir = path.resolve(stages[9]);




module.exports = ({port, open}) => {
  return new Promise((resolve, reject) => {
    const projectName = path.basename(path.resolve());
    const app = express();
    app.use(express.static(path.resolve(webDir, projectName)));
    app.listen(port);
    resolve('Сервер доступен по адресу: localhost:'+port);
    open && exec('open http://localhost:'+port);
  });
}
