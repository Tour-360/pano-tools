#!/usr/bin/env node

require('yargs/yargs')(process.argv.slice(2))
  .example('pt init', 'Выполните для начала работы с проектом')
  .commandDir('comands')
  .demandCommand()
  .completion('completion')
  .epilog('Copyright Tour-360.ru 2020')
  .help('h')
  .argv
