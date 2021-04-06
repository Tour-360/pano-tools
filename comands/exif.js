const path = require("path");
const { stages, execs } = require('../config.json');
const { exec } = require('child_process');
const { notification } = require('../utils');
const exiftool = path.resolve(__dirname, '../', execs.exiftool);

const jpegDir = path.resolve(stages[6]);

exports.command = 'exif'
exports.desc = 'Вшивание exif в jpeg файлы'
exports.builder = {};

exports.handler = () => {
  exec(`${exiftool} -xmp:ProjectionType=equirectangular -xmp:UsePanoramaViewer="True" -xmp:PoseHeadingDegrees=360 -xmp:CroppedAreaLeftPixels=0 -xmp:CroppedAreaTopPixels=0 -xmp:CroppedAreaImageWidthPixels=8000 -xmp:CroppedAreaImageHeightPixels=4000 -xmp:FullPanoWidthPixels=8000 -xmp:FullPanoHeightPixels=4000 -overwrite_original '${jpegDir}/'*.jpg`, (e) => {
    if (!e) {
      notification.success('Exif успешно вшит');
    } else {
      notification.error("Ощибка вшития Exif");
    }
  });
}
