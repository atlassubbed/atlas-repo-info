const { exec, spawn } = require("child_process")
const { join } = require("path")
const tmp = require("tmp")

// XXX currently node-tmp doesn't cleanup on CTRL+C, should be fixed soon
tmp.setGracefulCleanup()

const gitId = join(__dirname, "../node_modules/.bin/git-identity atlassubbed atlassubbed@gmail.com")

const makeRepo = (opts, cb) => {
  tmp.dir({dir: __dirname, unsafeCleanup:true, keep: false}, (err, cwd) => {
    if (err) return cb(err);
    let cmd = "git init";
    if (opts.commit) cmd += ` && touch file.js && git add . && ${gitId} && git commit -am 'a commit'`;
    if (opts.remotes) for (let r in opts.remotes) {
      cmd += ` && git remote add ${r} "${opts.remotes[r]}"`;
    }
    if (opts.subfolders) cmd += " && mkdir -p f1/f2"
    exec(cmd, {cwd}, (err, out) => {
      if (err) return cb(err);
      return cb(null, cwd)
    })
  })
}

module.exports = { makeRepo }
