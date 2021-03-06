const { files, chunk, average, getProject } = require('../utils.js');
const path = require("path");
const util = require("util");
const execPromise = util.promisify(require('child_process').exec);
const fs = require("fs");
const { stages, presets } = require('../config.json');

exports.command = 'pano-check'
exports.desc = 'Проверить качество сшивки'
exports.builder = {
  jpeg: {
    alias: 'j',
    desc: `Проверить панорамы сшитые из jpeg'ов`,
    type: 'boolean',
    default: false,
  },
  debug: {
    alias: 'd',
    type: 'boolean',
    default: false,
  }
}


exports.handler = async ({ jpeg, debug }) => {
  const panoramsDir = path.resolve(jpeg ? stages[6] : stages[3]);

  const list = files(panoramsDir, 'pts');

  const project = getProject();
  const preset = presets[project.preset];

  const status = {
    all: list?.length,
    bad: 0,
    good: 0,
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
    const directionStrict = {};

    cpList.forEach(p => {
      const param = p.split(' ');
      const n = param[1].substr(1);
      const N = param[2].substr(1);
      direction[n] = (n || 0)+1;
      direction[N] = (N || 0)+1;

      const [d1, d2] = [n, N].sort((a,b) => a - b);
      if (!directionStrict[d1]) directionStrict[d1] = {};
      directionStrict[d1][d2] = (directionStrict[d1][d2] || 0) + 1;
    });


    const directionValues = Object.values(direction);

    const dCheck = (D1, D2) => {
      const [d1, d2] = [D1, D2].sort((a, b) => a - b);
      return directionStrict?.[d1]?.[d2];
    }


    const successStitch = [
      dCheck(1,4), dCheck(1,2), // 1
      dCheck(2,1), dCheck(2,3), // 2
      dCheck(3,2), dCheck(3,4), // 3
      dCheck(4,3), dCheck(4,1), // 4
    ].map(i => i || 0);

    const successStitchMin = Math.min(...successStitch);
    const stitchStatus = successStitchMin > 5 ? 'good' : successStitchMin >= 1 ? 'warning' : 'bad';

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
      // successStitch,
      stitchStatus === 'good' ? 'good'.green : stitchStatus === 'warning' ? 'warning'.yellow : 'bad'.red,
    );
    [
      filePath,
      filePath.replace('.pts', '.tif')
    ].forEach(f => {
      execPromise(`tag --set ${[
        `${averageDistance}`,
        `[${cpList.length}]`,
        {
          warning: 'acpd-warning',
          good: 'acpd-good',
          bad: 'acpd-bad',
        }[distanceStatus],
        `stitch-${stitchStatus}`,
      ].join(',')} "${f}"`).catch((e) => {
        debug && console.log(e);
      });
    });
    status[stitchStatus === 'good' ? (distanceStatus === 'warning' ? 'warning' : 'good') : stitchStatus === 'warning' ? 'warning' : 'bad']++;
  });

  console.log('---------[stats]---------'.gray);


  const processed = status.all - status.notProcessed;

  const percent = (processed / status.all * 100).toFixed(0);
  console.log(`Processed – ${processed}/${status.all} (${percent}%)`[status.notProcessed ? 'gray' : "white"]);
  status.good && console.log(`Good: ${status.good}`.green);
  status.warning && console.log(`Warning: ${status.warning}`.yellow);
  status.bad && console.log(`Bad: ${status.bad}`.red);
}
