module.exports = ({port, open}) => {
  const { exec } = require('child_process');
  const path = require("path");
  const { stages, execs } = require('./config.json');
  const express = require('express')
  const webDir = path.resolve(stages[9]);

  return new Promise((resolve, reject) => {
    const app = express();
    app.use(express.static(webDir));
    app.listen(port);
    resolve('Сервер доступен по адресу: localhost:'+port);
    open && exec('open http://localhost:'+port);
  });
}
