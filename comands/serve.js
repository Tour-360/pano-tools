const {exec} = require('child_process');
const path = require("path");
const {notification, getFreePort} = require('../utils');
const bodyParser = require('body-parser');
const {stages, execs} = require('../config.json');
const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const webDir = path.resolve(stages[9]);
const fs = require('fs');
const fse = require('fs-extra');
const mime = require('mime');

exports.comand = 'serve';
exports.desc = 'Запуск сервера для разработки';
exports.builder = {
  open: {
    alias: 'o',
    desc: 'Open in browser',
  },
  port: {
    alias: 'p',
    default: 8080,
    desc: 'Port'
  }
}

exports.handler = async ({port, open}) => {
  const app = express();

  app.use(fileUpload());

  app.use(
    bodyParser.json({
      limit: 1024 * 10000000
    })
  );

  app.use(cors())

  app.post("/server/upload-file", async (req, res) => {
    const {file} = req.files;
    const {folder} = req.body;
    const relativePath = [folder, file.name].join('/');
    const absolutePath = path.resolve(webDir, relativePath);
    fse.ensureDirSync(path.resolve(webDir, folder));

    try {
      if (!fs.existsSync(absolutePath)) {
        await fs.writeFileSync(absolutePath, file.data);
        const mimeType = mime.getType(path.extname(file.name));
        const type = mimeType.split('/')?.[0];
        res.send({
          success: true,
          name: file.name,
          mime: mimeType,
          type,
          src: '/' + relativePath
        });
      } else {
        res.send({error: `File ${file.name} already exist`});
      }
    } catch (e) {
      res.send({error: 'Error file write', data: e});
    }
  });

  app.post("/server/save", (req, res) => {
    const {tour, manifest} = req.body;
    const tourFile = path.resolve(webDir, manifest || 'tour.json');
    // console.log(JSON.stringify(req.body.tour || {}, null, 2));
    fs.writeFile(
      tourFile,
      JSON.stringify(tour || {}, null, 2),
      (err) => {
        if (err) {
          res.send({
            success: false,
            error: err
          });
          return console.log(err);
        } else {
          notification.success(`Проект сохранен`);
          console.log([
            ['Название', tour.name],
            ['Панорам', tour.panorams.length],
            ['Областей', tour.panorams.reduce((s, item) => s + (item?.areas?.length || 0), 0)],
            ['Связей', tour.panorams.reduce((s, item) => s + (item?.links?.length || 0), 0)],
            ['Этажей', tour.floors.length],
            ['Высота всех этажей', tour.floors.reduce((s, f) => s + (f.height || 0), 0) / 100 + "м"],
          ].map(([title, value]) => `${title}: ${value.toString().bold}`).join('\n'));

          res.send({success: 'true'});
        }
      });
  });

  app.use(express.static(webDir));

  const freePort = await getFreePort(port);

  app.listen(freePort, () => {
    const host = ['http://localhost', freePort].join(':');
    notification.success('Сервер доступен по адресу: ' + host);
    open && exec('open ' + host);
  }).on('error', (err) => {
    if (err.code === "EADDRINUSE") {
      notification.error('Serve уже запущен');
    } else {
      notification.error('Error: ', err.message);
    }
  });
}
