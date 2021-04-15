const fs = require('fs');
const path = require('path');
const xml = require('xml-parse');

const { files, chunk, average } = require('../utils.js');

const { stages } = require('../config.json');

exports.comand = 'web';
exports.desc = 'Компоновка виртуальн' +
  'ого тура для веб';

const getNumber = text => {

  const n = text?.match(/([\d-])/gm, '')?.join('');
  return n ? parseFloat(n) : null;
}

exports.handler = async () => {
  let flag = true;
  for (const panorama of chunk(files(stages[0], 'xmp'), 12)) {
    flag = !flag;

    const data = panorama.map(name => {
      const file = path.resolve(stages[0], name);
      const xmpContent = fs.readFileSync(file, 'utf-8');
      return {
        file,
        name,
        flag,
        xmpContent,
        temperature: getNumber(xmpContent.match(/(Temperature)=\"(.*)\"/g)?.[0]),
        tint: getNumber(xmpContent.match(/(Tint)=\"(.*)\"/gm)?.[0])
      }
    })


    const temperature = parseInt(average(data.map(d => d.temperature)));
    const tint = parseInt(average(data.map(d => d.tint)));

    for (file of data) {
      const newContent = file.xmpContent
        .replace(/(Temperature)=\"(.*)\"/g, `Temperature="${temperature}"`)
        .replace(/(Label)=\"(.*)\"/g, `Label="${file.flag ? "Синий" : "Красный"}"`)
        .replace(/(Tint)=\"(.*)\"/g, `Tint="${tint > 0 ? "+" + tint : tint}"`);

      console.log({
        name: file.name,
        temperature: file.temperature,
        tint: file.tint,
        a: temperature,
        b: tint,
      });

      fs.writeFileSync(file.file, newContent);
    }
  }
}