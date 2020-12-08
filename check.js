// const chokidar = require("chokidar");
const { files, bar, chunk, average, getProject } = require('./utils.js');
const path = require("path");
const fs = require("fs");
const { stages, presets, execs } = require('./config.json');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = (length) => new Promise(async (resolve, reject) => {
  const panoramsDir = path.resolve(stages[3]);

  const list = files(panoramsDir, 'pts');

  const project = getProject();
  const preset = presets[project.preset];

  const status = {
    all: list?.length,
    fail: 0,
    success: 0,
    warning: 0,
    notProcessed: list?.length
  }

  list?.forEach((file) => {
    const filePath = path.resolve(panoramsDir, file);
    const body = fs.readFileSync(filePath, 'utf8')

    const processed = body.includes('#-iccprofile');

    if (!processed) {
      console.log(`${file} – not processed`.gray);
      return;
    } else {
      status.notProcessed--;
    }

    const startControlPointsIndex = body.indexOf('# Control points:');
    const endControlPointsIndex = body.indexOf('# optimizer:');

    const rows = body.substr(
      startControlPointsIndex,
      endControlPointsIndex - startControlPointsIndex
    )
      .trim()
      .split('\r\n')

      .splice(1);


    const cpList = chunk(rows, 2)
      .map(cp => cp.join(' ').replace('# Control Point', ''));

    const direction = {};

    cpList.forEach(p => {
      const param = p.split(' ');
      const n = param[1].substr(1);
      const N = param[2].substr(1);
      direction[n] = (n || 0)+1;
      direction[N] = (N || 0)+1;
    });


    const directionValues = Object.values(direction);
    const success = directionValues.length >= preset.directions &&
      Math.min(...directionValues) >= 5 // Колличество точек на сторону >= 5

    const distances = cpList.map(p => parseFloat(p.split(' ').pop())) || [];
    const averageDistance = average(distances).toFixed(3);
    const minDistance = Math.min(...distances).toFixed(3);
    const maxDistance = Math.max(...distances).toFixed(3);

    if (averageDistance > 1.8 || cpList.length === 0) {
      distanceStatus = 'bad';
    } else if ( averageDistance <= 1.8 && averageDistance > 1) {
      distanceStatus = 'warning';
    } else if (averageDistance <= 1) {
      distanceStatus = 'good';
    }

    console.log(
      file,
      `[${cpList.length}]`[cpList.length < 20 ? 'red' : cpList.length < 30 ? 'yellow' : 'white'],
      averageDistance.toString()[{
        warning: 'yellow',
        good: 'green',
        bad: 'red',
      }[distanceStatus]],
      success ? 'success'.green : 'fail'.red
    );

    status[success ? (distanceStatus === 'warning' ? 'warning' : 'success') : 'fail']++;
  });

  console.log('---------[stats]---------'.gray);



  const processed = status.all - status.notProcessed;

  const percent = (processed / status.all * 100).toFixed(0);
  console.log(`Processed – ${processed}/${status.all} (${percent}%)`[status.notProcessed ? 'gray' : "white"]);
  status.success && console.log(`Success: ${status.success}`.green);
  status.warning && console.log(`Warning: ${status.warning}`.yellow);
  status.fail && console.log(`Fail: ${status.fail}`.red);
})

