const fs = require('fs');
const { exec } = require('child_process');
const chokidar = require("chokidar");
const { files, dirs, tempPostOptions, bar, notification } = require('../utils.js');
const { stages, execs } = require('../config.json');
const path = require("path");

const exiftool = require('node-exiftool')
const ep = new exiftool.ExiftoolProcess();

// const exiftool = path.resolve(__dirname + execs.exiftool);

const rawDir = path.resolve(stages[0]);
const jpegDir = path.resolve(stages[6]);


exports.command = 'gps'
exports.desc = 'Внедрение в файлы данных gps'
exports.builder = {};

exports.handler = () => {
  const gpxFiles = files(path.resolve(), 'gpx');
  if (gpxFiles.length === 0) {
    notification.error('Не найден gpx файл в корне проекта');
  }

  const gpxFile = path.resolve(gpxFiles[0]);

  console.log('Получение даты съемки из CR2');
  ep
    .open()
    .then(() => ep.readMetadata(rawDir, ['SubSecDateTimeOriginal']))
    .then(r => {
      return r.data
        .sort((a,b) => a.SourceFile > b.SourceFile ? 1 : -1 )
        .filter((_, i) => i % 12 == 0)
        .map( obj => obj.SubSecDateTimeOriginal);
    })
    .then(dates => {
      console.log('Добавление даты съемки в JPEG');
      return Promise.all(
        files(jpegDir, 'jpg')
          .map(i => path.resolve(jpegDir, i))
          .map((file, i) => {
            return ep.writeMetadata(file, {
              SubSecDateTimeOriginal: dates[i],
              createdate: dates[i],
            }, ['overwrite_original'])
          })
      )}
    )
    .then(() => {
      ep.close()
      console.log('Запись параметров GEO из ' + gpxFile);
      exec(`exiftool -delete_original -geotag log.gpx "-xmp:geotime<SubSecDateTimeOriginal" ${jpegDir}`, err => {
        if (!err) {
          notification.success('GEO Данные успешно вшиты');
        } else {
          notification.error('Ошибка вшития GEO данных');
        }
      })
    })
}

