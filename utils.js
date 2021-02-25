const fs = require('fs');
const os = require('os');
const path = require("path");
const cliProgress = require('cli-progress');
const notifier = require('node-notifier');
const activeWin = require('active-win');
const net = require('net');

const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});


module.exports.dirs = p => {
  try {
    return fs.readdirSync(p)
      .filter(f => fs.statSync(path.join(p, f)).isDirectory())
      .sort(collator.compare);
  } catch (e) {
    notification.error('Не получаеться прочитать файлы из каталога ' + p);
    process.exit(1);
  }
}

module.exports.stringify = (object) => {
  const json = JSON.stringify(object, null, 2);
  return json.length <= 500*1000 ? json : JSON.stringify(object);
}


module.exports.files = (patch, ext) => {
  try {
    return fs.readdirSync(patch).filter(f => {
        const file = f.split('.').pop();
        return (ext ? (file.toLowerCase() == ext.toLowerCase()) : true);
      }).sort(collator.compare);
  } catch (e) {
    notification.error('Не получаеться прочитать файлы из каталога ' + patch);
    process.exit(1);
  }
}

const terminalIsFocus = () => new Promise(async (resolve, reject) => {
  const hash = Math.random();
  process.stdout.write(
    String.fromCharCode(27) + ']0;' + hash + String.fromCharCode(7)
  ); // Set terminal title

  try {
    const window = await activeWin();
    resolve(window?.title.includes(hash));
  } catch (e) {
    reject(e);
  }

  process.stdout.write(
    String.fromCharCode(27) + ']0;'+ String.fromCharCode(7)
  ); // Clear terminal title
})

module.exports.degToRad = deg => deg / 180 * Math.PI;

const message = async (message = 'text', type = 'info') => {
  const title = 'Pano-tools';
  let icon = null;

  if (type === 'info') {
    console.log(message.bold);
  } else if (type === 'success') {
    console.log(message.green);
    icon = '✅';
  } else if (type === 'warning') {
    console.log(message.yellow);
    icon = '⚠️';
  } else if (type === 'error') {
    console.log(message.red);
    icon = '❌';
  }

  try {
    if (!await terminalIsFocus()) {
      notifier.notify({
        title,
        sound: type === 'error' ? 'Basso' : type === 'warning' ? 'Sosumi' : 'Hero',
        message: [icon, message].sort(Boolean).join(' ')
      });
    }
  } catch (e) {
    // console.log(e);
  }
}

const notification = {
  info: msg => message(msg, 'info'),
  warning: msg => message(msg, 'warning'),
  error: msg => message(msg, 'error'),
  success: msg => message(msg, 'success'),
}

module.exports.notification = notification;


module.exports.tempPostOptions = (opts) => {
  fs.writeFileSync(
    os.tmpdir()+"/pano-tools",
    Object.keys(opts).map((key) => key + " " + opts[key]).join("\n")
  );
}

const isPortFree = port =>
  new Promise(resolve => {
    const server = require('http')
      .createServer()
      .listen(port, () => {
        server.close()
        resolve(true)
      })
      .on('error', () => {
        resolve(false)
      })
  })



module.exports.getFreePort = async (port = 80) => {
  let free = null;
  while (!free) {
    free = await isPortFree(port);
    if (!free) {
      port = parseInt(port)+1;
    }
  }
  return port;
}

module.exports.ifExistSync = (path) => {
  try {
    return !!fs.statSync(path);
  } catch (e) {
    return false;
  }
}

module.exports.average = (nums) => {
  if (!nums.length) {
    return 0;
  }
  return nums.reduce((a, b) => (a + b)) / nums.length;
}


module.exports.chunk = (array, size) => {
  const chunked_arr = [];
  for (let i = 0; i < array.length; i++) {
    const last = chunked_arr[chunked_arr.length - 1];
    if (!last || last.length === size) {
      chunked_arr.push([array[i]]);
    } else {
      last.push(array[i]);
    }
  }
  return chunked_arr;
}


module.exports.createQueues = (func, callback) => {
  const cpus = (os.cpus().length - 1) || 1;
  let queues = cpus;
  for (let i=0; i < cpus; i++) func(() => {
    if(--queues==0) callback();
  })
}

module.exports.getProject = (func, callback) => {
  return JSON.parse(
    fs.readFileSync(
      path.resolve('project.json')
    )
    .toString('utf8')
  );
}

module.exports.bar = new cliProgress.Bar({
  format: '[{bar}] | {percentage}% | Осталось: {eta_formatted}',
  clearOnComplete: true
}, cliProgress.Presets.rect);
