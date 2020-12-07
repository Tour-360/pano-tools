const fs = require('fs');
const os = require('os');
const path = require("path");
const cliProgress = require('cli-progress');
const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});


module.exports.dirs = p => fs.readdirSync(p)
.filter(f => fs.statSync(path.join(p, f)).isDirectory())
.sort(collator.compare);


module.exports.files = (patch, ext) => fs.readdirSync(patch).filter(f => {
  const file = f.split('.').pop();
  return (ext ? (file.toLowerCase() == ext.toLowerCase()) : true);
}).sort(collator.compare);


module.exports.tempPostOptions = (opts) => {
  fs.writeFileSync(
    os.tmpdir()+"/pano-tools",
    Object.keys(opts).map((key) => key + " " + opts[key]).join("\n")
  );
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
