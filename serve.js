module.exports = ({port, open}) => {
  const { exec } = require('child_process');
  const path = require("path");
  const bodyParser = require('body-parser');
  const { stages, execs } = require('./config.json');
  const express = require('express')
  const webDir = path.resolve(stages[9]);
  const fs = require('fs');

  return new Promise((resolve, reject) => {
    const app = express();

    app.use(
      bodyParser.json()
    );

    app.post("/save", (req, res) => {
      const tourFile = path.resolve(webDir, req.body.manifest || 'tour.json');
      console.log(JSON.stringify(req.body.tour || {}, null, 2));
      fs.writeFile(
        tourFile,
        JSON.stringify(req.body.tour || {}, null, 2),
        (err) => {
        if (err) {
          res.send({
            success: false,
            error: err
          });
          return console.log(err);
        } else {
          res.send({ success: 'true' });
        }
      });
    });

    app.use(express.static(webDir));
    app.listen(port, () => {
      resolve('Сервер доступен по адресу: localhost:'+port);
      open && exec('open http://localhost:'+port);
    }).on('error', function(err) {
      if (err.code === "EADDRINUSE") {
        reject('Serve уже запущен')
      } else {
        reject(err);
      }
    });
  });
}
