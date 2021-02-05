#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
function commandExists(name) {
  try {
    fs.accessSync(path.resolve(__dirname, 'comands', name + ".js"), fs.R_OK);
    return true;
  } catch (e) {
    return false;
  }
}

require('yargs/yargs')(process.argv.slice(2))
  .example('pt init', 'Выполните для начала работы с проектом')
  .commandDir('comands')
  .demandCommand()
  .completion('completion')
  .epilog('Copyright Tour-360.ru 2020')
  .help('h')
  .check((argv) => {
    if (commandExists(argv._[0])) {
      return true;
    }
    throw new Error(`ОШИБКА! ${argv._[0]} – нет такой команды`.red);
  })
  .argv
