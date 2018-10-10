const fs = require('fs');
const os = require('os');
const path = require("path");
const cliProgress = require('cli-progress');


module.exports.dirs = p => fs.readdirSync(p).filter(f => fs.statSync(path.join(p, f)).isDirectory());
module.exports.files = (patch, ext) => fs.readdirSync(patch).filter(f => {
  return f.split('.').pop().toLowerCase() == ext.toLowerCase();
});


module.exports.tempPostOptions = (opts) => {
  fs.writeFileSync(
    os.tmpdir()+"/pano-tools",
    Object.keys(opts).map((key) => key + " " + opts[key]).join("\n")
  );
}


module.exports.createQueues = (func, callback) => {
  const cpus = (os.cpus().length - 1) || 1;
  let queues = cpus;
  for (let i=0; i < cpus; i++) func(() => {
    if(--queues==0) callback();
  })
}

module.exports.bar = new cliProgress.Bar({
  format: '[{bar}] | {percentage}% | Осталось: {eta_formatted}',
  clearOnComplete: true
}, cliProgress.Presets.rect);
