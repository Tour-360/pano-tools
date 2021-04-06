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
exports.builder = {
  a: {
    alias: 'a'
  },
  b: {
    alias: 'b'
  }
}

const openMVG = (command, args) => new Promise(async (resolve, reject) => {
  const stdout = [];
  const stderr = [];

  const dockerImageName = 'larshaalck/openmvg';
  try {
    const images = (await execPromise('docker images')).stdout.toString();
    if (!images.includes(dockerImageName)) {
      console.log(`docker pull ${dockerImageName}`.bold);
      await execPromise(`docker pull ${dockerImageName}`);
    }
  } catch (e) {
    await notification.error('Docker is not running');
    process.exit(1);
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


const getLinks = (object, id) => {
  r.match(/n(.\d)+\s-{2}?\s+n(.\d)/g)
    .map(m => m.split(' --  ').map(id => parseInt(id.replace( /^\D+/g, ''))))
    .map(([m, g]) => m === 10 ? g : null ).filter(Boolean)
}

const updatePanoPosition = async () => {
  const sfmData = JSON.parse(await fs.readFile(path.resolve(outputDir, 'sfm_data.json'),'utf-8'));
  const tour = JSON.parse(await fs.readFile(path.resolve(webDir, 'tour.json'),'utf-8'));
  const putativeMatches = await fs.readFile(path.resolve(outputDir, 'putative_matches'),'utf-8');
  const matches = putativeMatches.match(/n(\d)+\s-{2}?\s+n(\d)/g)
    .map(m => m.split(' --  ').map(id => parseInt(id.replace( /^\D+/g, ''))));

  // const matching = {};
  // sfmData.views.forEach(v => {
  //   const data = v?.value.ptr_wrapper?.data;
  //   const panoId = data?.filename.replace('.jpg', '');
  //   matching[panoId] = data?.id_view;
  // });

  tour.panorams = tour.panorams.map(p => {
    const view = sfmData.views.find(v => {
      return v.value.ptr_wrapper.data.filename.toString() === p.id + '.jpg'
    });

    const currentViewId = view?.value?.ptr_wrapper?.data?.id_view;
    const value = sfmData.extrinsics.find(p => p.key === currentViewId)?.value;
    const position = value?.center;
    const rotation = value?.rotation?.[0];


    const links = matches
      .map(([m, g]) => m === currentViewId ? g : null )
      .filter(Boolean)
      .map(viewId => sfmData.views.find(v => {
        return parseInt(v.value.ptr_wrapper.data.id_view) === parseInt(viewId)
      })?.value?.ptr_wrapper?.data?.filename.replace('.jpg', ''));


    console.log(p.id.bold + ` [${currentViewId}]`[position ? 'green' : 'red'] + ' - ' + links );

    if (position) {
      const [lat, lon, alt] = projector.unproject(rotation[0], rotation[2], rotation[1]);

      const scale = Math.atan(Math.PI/2)*180/Math.PI*10 || 588;
      const [x, y, z] = position.map(c => c * scale);
      return {
        ...p,
        x,
        y: z * -1,
        heading: lon * -1,
        heightFromFloor: 148,
        links: [],
        // links: links.map(id => ({ id }))
      }
    } else {
      return p;
    }
  });

  // NORMOLIZE
  const center = (arr) => {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  const circleSize = 8 * 100;
  const circleS = circleSize * circleSize;
  const xs = tour.panorams.map(p => p.x).filter(Boolean);
  const ys = tour.panorams.map(p => p.y).filter(Boolean);
  const width = Math.abs(Math.max(...xs) - Math.min(...xs));
  const height = Math.abs(Math.max(...ys) - Math.min(...ys));
  const s = width * height;
  const rate = Math.sqrt(circleS * xs.length) / Math.sqrt(s);
  const offsetX = center(xs);
  const offsetY = center(ys);


  tour.panorams = tour.panorams.map(p => {
    return p.x ? {
      ...p,
      x: (p.x - offsetX) * rate,
      y: (p.y - offsetY) * rate,
    } : p
  });



  await fs.writeFile(path.resolve(webDir, 'tour.json'), JSON.stringify(tour, null, 2));
}



exports.handler = async ({ a, b }) => {

  try {
    if (!(a && b)) {
      console.log('1/5'.green);
      await openMVG(
        'openMVG_main_SfMInit_ImageListing',
        '-i /dataset/  -o /result/ -c 7 -f 1'
      );
      console.log('2/5'.green);
      await openMVG(
        'openMVG_main_ComputeFeatures',
        '-i /result/sfm_data.json  -o /result/ -m SIFT -p HIGH'
      );
      console.log('3/5'.green);
      await openMVG(
        'openMVG_main_ComputeMatches',
        '-i /result/sfm_data.json  -o /result/ -g a'
      );
    }
    console.log('4/5'.green);
    try {
      await openMVG(
        'openMVG_main_IncrementalSfM',
        `-i /result/sfm_data.json -f ADJUST_ALL -m /result/ -o /result/` + ((a && b) ? ` -a ${a}.jpg -b ${b}.jpg` : '')
      );
    } catch (e) {}

    console.log('5/5'.green);
    await openMVG(
      'openMVG_main_ConvertSfM_DataFormat',
      'binary -i /result/sfm_data.bin -o /result/sfm_data.json -V -I -E'
    );

    console.log('6/6'.green);
    await openMVG(
      'openMVG_main_openMVG2openMVS',
      'binary -i /result/sfm_data.bin -o /result/scene.mvs -d scene_undistorted_images'
    );


    await updatePanoPosition();
    await notification.success('Done!');

  } catch (e) {
    console.log('ERROR'.red, e);
  }
}
