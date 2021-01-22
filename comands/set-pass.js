const crypto = require("crypto");
const path = require("path");
const fs = require("fs").promises;
const { notification } = require('../utils');
const { stages } = require('../config.json');
const inquirer = require('inquirer');
exports.command = 'set-pass [password]';
exports.desc = 'Установка пароля разработчика';
exports.handler = async ({ password }) => {

  if (!password) {
    try {
      password = (await inquirer.prompt([{
        type: 'password',
        message: 'Выбирите новый пароль:',
        name: 'password',
      }])).password;
    } catch (e) {
      await notification.error('Ошибка ввода пароля');
      return process.exit(1);
    }
  }

  if (password.toString().length < 4) {
    await notification.error('Слишком короткий пароль');
    return process.exit(1);
  }

  const hashPassword = crypto
    .createHmac("sha256", password.toString())
    .digest("hex");

  try {
    await fs.writeFile(path.resolve(stages[9], '.tools_password'), hashPassword);
    await notification.success('Пароль успешно задан');
  } catch (e) {
    await notification.error('Ошибка установки пароля');
  }
}
