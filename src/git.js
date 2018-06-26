const { exec } = require("child_process")

const getRoot = (cwd, cb) => {
  exec("git rev-parse --show-toplevel", {cwd}, (err, stdout) => {
    if (err) return err.message.match(/Not a git repository/) ? cb(null, "") : cb(err);
    cb(null, stdout.trim())
  })
}

const getBranch = (cwd, cb) => {
  exec("git branch", {cwd}, (err, stdout) => {
    if (err) return cb(err);
    const branch = stdout.split("\n").filter(b => b[0]==="*")
    cb(null, branch.length ? branch[0].slice(2) : null)
  })
}

const getRemotes = (cwd, cb) => {
  exec("git remote --verbose", {cwd}, (err, stdout) => {
    if (err) return cb(err);
    cb(null, stdout.trim().split("\n").reduce((p,c)=>{
      if (c){
        p = p || {};
        c = c.split("\t")
        p[c[0]] = c[1].slice(0, c[1].lastIndexOf(" "))
      }
      return p;
    }, null))
  })
}

module.exports = { getRoot, getBranch, getRemotes }
