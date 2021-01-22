const fs = require('fs-extra');
const path = require("path");
const { notification } = require('../utils');
const { stages } = require('../config.json');

const tiffDif = path.resolve(stages[1]);
const hdrDir = path.resolve(stages[2]);
const panoDir = path.resolve(stages[3]);
const naridDir = path.resolve(stages[4]);
const cubeDir = path.resolve(stages[7]);
const playerDir = path.resolve(stages[8]);


exports.command = 'delete'
exports.desc = 'Удаление временных рабочих каталогов'

exports.handler = () => {
  [tiffDif, hdrDir, panoDir, naridDir, cubeDir, playerDir].map(dir => {
    fs.existsSync(dir) && fs.removeSync(dir);
    notification.success('Временные каталоги успешно удалены');
  })
}
