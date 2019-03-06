const fs = require('fs');
const path = require("path");
const chokidar = require("chokidar");
const { exec, execSync } = require('child_process');
const { bar, files } = require('./utils.js');

const { stages } = require('./config.json');

const jpegDir = path.resolve(stages[6]);

module.exports = (fileName, options) => {
  return new Promise((resolve, reject) => {
    console.log(files(jpegDir));
    const images = files(jpegDir);
    const imagesString = images.map(f => path.resolve(jpegDir, f)).join(' -i ');
    console.log(imagesString);
    execSync(`ffmpeg -f concat -r 1/5 -i ${imagesString} -crf 20 -r 30 -c:v libx264 -preset slow -profile:v high -bf 2 -g 30 -coder 1 -crf 18 -pix_fmt yuv420p -movflags +faststart 360.mp4 -y -loglevel warning`);
    resolve('ok');
  });
}
