const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const fse = require("fs-extra");
const {notification} = require('../utils');
const {stages} = require('../config.json');
const fetch = require('node-fetch');
const inquirer = require('inquirer');
exports.command = 'db';
exports.desc = 'Установка пароля разработчика';
exports.builder = {
  base: {
    alias: 'b',
    type: 'string',
    desc: 'Airtable base hash',
  },
  table: {
    alias: 't',
    type: 'array',
    desc: 'Airtable table name'
  },
  removeTable: {
    alias: 'r',
    type: 'array',
    desc: 'Remove table'
  }
}

async function download(url, filePath) {
  const res = await fetch(url);
  await new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(filePath);
    res.body.pipe(fileStream);
    res.body.on("error", (err) => {
      reject(err);
    });
    fileStream.on("finish", function() {
      resolve();
    });
  });
}

exports.handler = async ({ base, table, removeTable }) => {
  const webDir = path.resolve(stages[9]);
  const tablesDir = path.resolve(webDir, 'tables');
  const tourJsonPath = path.resolve(webDir, 'tour.json');
  const tour = JSON.parse(fs.readFileSync(tourJsonPath,'utf-8'));
  const tourOldDB = {...tour.db};

  if (!tour.db) {
    tour.db = {
      base: null,
      tables: []
    }
  }

  if (base) {
    console.log(`Установленна база: ${base.toString().yellow}`.bold);
    tour.db.base = base;
  }

  if (table) {
    console.log(`Добавлены таблицы: ${(table).map(t => t.toString().yellow).join(`, `.white)}`.bold);
    tour.db.tables = [
      ...tour.db.tables,
      ...(table).map(t => t.toString())
    ].filter((item, pos, self) => self.indexOf(item) === pos); // только уникальные таблицы
  }

  if (removeTable) {
    console.log(`Удаление таблицы: ${(removeTable).map(t => t.toString().red).join(`, `.white)}`.bold);
    tour.db.tables = tour.db.tables.filter(t => !removeTable.includes(t));
  }

  if (JSON.stringify(tourOldDB) !== JSON.stringify(tour.db)) {
    console.log("Было:  ".bold.white, tourOldDB);
    console.log("Стало: ".bold.white, tour.db);
    fs.writeFileSync(tourJsonPath, JSON.stringify(tour, null, 2));
    console.log(`tour.json успешно обновлен`);
  }

  if (tour.db.base && tour.db?.tables) {
    !fs.existsSync(tablesDir) && fs.mkdirSync(tablesDir);
    for (const t of tour.db.tables) {
      process.stdout.write(`Закгпузка таблицы ${t.toString().yellow}`.bold);
      try {
        await download(
          `https://tour-360.ru/airtable/base/${tour.db.base}/${t}`,
          path.resolve(tablesDir, `${t}.json`)
        );
        console.log(` – ${'success'.green}`.bold);
      } catch (e) {
        console.log(` – ${'fail'.red}`.bold);
      }
    }
  } else {
    notification.warning('Ошибка конфигурации. Используйте флаги --base и --table что бы задать бузу и балицы');
  }
}
