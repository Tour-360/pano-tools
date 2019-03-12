const fs = require('fs');
const path = require("path");
const { stages, execs } = require('./config.json');
const { exec } = require('child_process');
const exiftool = path.resolve(__dirname, execs.exiftool);

const jpegDir = path.resolve(stages[6]);
module.exports = () => {
  return new Promise((resolve, reject) => {
    exec(`${exiftool} -xmp:ProjectionType=equirectangular -xmp:UsePanoramaViewer="True" -xmp:PoseHeadingDegrees=360 -xmp:CroppedAreaLeftPixels=0 -xmp:CroppedAreaTopPixels=0 -xmp:CroppedAreaImageWidthPixels=8000 -xmp:CroppedAreaImageHeightPixels=4000 -xmp:FullPanoWidthPixels=8000 -xmp:FullPanoHeightPixels=4000 -overwrite_original ${jpegDir}/*.jpg`, (e) => {
      !e ? resolve('Exif успешно вшит') : reject(e);
    });
  });
}
