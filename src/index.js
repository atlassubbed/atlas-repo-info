const { readdir } = require("fs");
const { basename, dirname } = require("path")
const parallel = require("atlas-parallel")
const { getRoot, getBranch, getRemotes } = require("./git")

module.exports = (dir, cb) => {
  getRoot(dir, (err, gitRoot) => {
    if (err) return cb(err);
    if (!gitRoot) return cb(null);
    const state = {
      gitRoot,
      name: basename(gitRoot), 
      dir: basename(dirname(gitRoot))
    }
    parallel([
      done => getBranch(dir, (err, branch) => {
        if (err) return done(err);
        state.branch = branch, done()
      }),
      done => getRemotes(dir, (err, remotes) => {
        if (err) return done(err);
        state.remotes = remotes, done()
      })
    ], errs => {
      if (errs.length) return cb(errs[0]);
      cb(null, state)
    })
  })
}
