

module.exports = (template = 'default', size = 30) => {
  const fs = require('fs');
  const path = require("path");
  const { dirs, files, bar, getProject } = require('./utils.js');
  const { stages, execs } = require('./config.json');
  const nadirDir = path.resolve(stages[4]);
  const { exec } = require('child_process');
  var sizeOf = require('image-size');


  const manifest = {
    panorams: []
  }

  return new Promise((resolve, reject) => {
    const images = files(nadirDir, 'tif');

    bar.start(files.length, 0);
    images.map((file, i) => {

      const image = path.resolve(nadirDir, file);

      const imageSize = sizeOf(image);
      const imSize = (imageSize.width / 100 * size) + 'x' + (imageSize.height / 100 * size);

      const templateFile = path.resolve(__dirname, 'templates', 'watermarks', template + '.png');
      exec(`convert -background none ${image} \\( ${templateFile} -resize ${imSize} \\) -gravity center -composite ${image}`, err => {
        if (err) {
          return reject(err);
        }
        bar.update(i);
        if(i+1 == images.length) {
          bar.stop();
          resolve('Ватермарки вшыти в надиры');
        }
      })

    });
  });
}
