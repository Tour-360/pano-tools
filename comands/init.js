const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const { presets, stages } = require('../config.json');
const { notification } = require('../utils');

exports.command = 'init'
exports.desc = 'Инициализация проекта, создание рабочей директории';

exports.builder = {
  folder: {
    alias: 'f',
    desc: 'Folder name',
    default: null
  },
  name: {
    alias: 'n',
    desc: 'Project name',
    default: null
  }
};

exports.handler = async ({ name, folder }) => {


  inquirer.prompt([{
    type: 'list',
    message: 'Выберите пресет:',
    name: 'preset',
    choices: Object.keys(presets)
  }]).then(async ({preset}) => {
    projectJson = JSON.stringify({
      name,
      folder,
      preset: preset
    }, null, 2);

    if (name) {
      if (!fs.existsSync(name)){
        fs.mkdirSync(name);
        stages.map(folder => fs.mkdirSync(name + '/' + folder));
        await notification.success("Каталог проекта создан".green)
      } else {
        await notification.warning("Проект уже существует".green)
        fs.writeFileSync(path.resolve(name, 'project.json'), projectJson);
      }
    } else {
      stages.map(folder => {
        !fs.existsSync(folder) && fs.mkdirSync(folder);
        fs.writeFileSync('project.json', projectJson);
      });
      await notification.success("Каталоги созданы".green)
    }
  });
}
