const path = require("path");
const util = require('util');
const projector = require('ecef-projector');
const execPromise = util.promisify(require('child_process').exec);
const { exec } = require('child_process');
const { stages, execs } = require('../config.json');
const inputDir = path.resolve(stages[6]);
const webDir = path.resolve(stages[9]);
const { notification } = require('../utils.js');
const outputDir = path.resolve('SfM');
const fs = require('fs').promises;

exports.command = 'mvg'
exports.desc = 'Создание SfM при помощи openMVG';
exports.builder = {}

const openMVG = (command, args) => new Promise(async (resolve, reject) => {
  const stdout = [];
  const stderr = [];

  const dockerImageName = 'larshaalck/openmvg';
  const images = (await execPromise('docker images')).stdout.toString();
  if (!images.includes(dockerImageName)) {
    console.log(`docker pull ${dockerImageName}`.bold);
    await execPromise(`docker pull ${dockerImageName}`);
  }

  const cmdLine = [`docker run`,
    `-v "${inputDir}":/dataset`,
    `-v "${outputDir}":/result ${dockerImageName}`,
    `./opt/openMVG_Build/Linux-x86_64-RELEASE/${command}`,
    args].join(' ');

  console.log(cmdLine.bold);
  const docker = exec(cmdLine);

  docker.stdout.on('data', (data) => {
    process.stdout.write(data);
    stdout.push(data.toString());
  });

  docker.stderr.on('data', (data) => {
    process.stderr.write(data);
    stderr.push(data.toString());
  });

  docker.on('exit', (code, message) => {
    console.log(stderr.join('').yellow);

    if (code) {
      reject({ code, message });
    } else {
      resolve(stdout.join(''));
    }
  });
});


const updatePanoPosition = async () => {
  const sfmData = JSON.parse(await fs.readFile(path.resolve(outputDir, 'sfm_data.json'),'utf-8'));
  const tour = JSON.parse(await fs.readFile(path.resolve(webDir, 'tour.json'),'utf-8'));
  tour.panorams = tour.panorams.map(p => {
    const view = sfmData.views.find(v => {
      return v.value.ptr_wrapper.data.filename.toString() === p.id + '.jpg'
    });

    const value = sfmData.extrinsics.find(p => p.key === view?.value?.ptr_wrapper?.data?.id_view)?.value;
    const position = value?.center;
    const rotation = value?.rotation?.[0];

    if (position) {
      const [lat, lon, alt] = projector.unproject(rotation[0], rotation[2], rotation[1]);
      console.log({ rotation });
      console.log({lat, lon, alt});

      const scale = Math.atan(Math.PI/2)*180/Math.PI*10 || 588;
      const [x, y, z] = position.map(c => c * scale);
      return {
        ...p,
        x,
        y: z * -1,
        heading: lon * -1,
        heightFromFloor: 148,
      }
    } else {
      return p;
    }
  });

  console.log(sfmData.views[0].value.ptr_wrapper.data.filename);
  console.log(tour.panorams);

  await fs.writeFile(path.resolve(webDir, 'tour.json'), JSON.stringify(tour, null, 2));
}



exports.handler = async () => {

  try {
    console.log('1/5'.green);
    await openMVG(
      'openMVG_main_SfMInit_ImageListing',
      '-i /dataset/  -o /result/ -c 7 -f 1'
    );
  //   console.log('2/5'.green);
  //   await openMVG(
  //     'openMVG_main_ComputeFeatures',
  //     '-i /result/sfm_data.json  -o /result/ -m SIFT -p HIGH'
  //   );
  //   console.log('3/5'.green);
  //   await openMVG(
  //     'openMVG_main_ComputeMatches',
  //     '-i /result/sfm_data.json  -o /result/ -g a'
  //   );
  //   console.log('4/5'.green);
  //   try {
  //     await openMVG(
  //       'openMVG_main_IncrementalSfM',
  //       '-i /result/sfm_data.json -m /result/ -o /result/'
  //     );
  //   } catch (e) {}
  //   console.log('5/5'.green);
  //   await openMVG(
  //     'openMVG_main_ConvertSfM_DataFormat',
  //     'binary -i /result/sfm_data.bin -o /result/sfm_data.json -V -I -E'
  //   );
  //
  //
  //   await updatePanoPosition();
  //   await notification.success('Done!');

  } catch (e) {
    console.log('ERROR'.red, e);
  }
}
