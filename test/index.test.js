const { describe, it } = require("mocha")
const { expect } = require("chai")
const { basename, dirname, join } = require("path")
const parallel = require("atlas-parallel")
const rewire = require("rewire");
const git = rewire("../src/git")
const getRepoInfo = rewire("../src/index")
const { makeRepo } = require("./helpers")

let reverts = [];

describe("get basic repo state information", function(){

  beforeEach(function(){
    let revert;
    while (revert = reverts.pop()) revert();
  })

  it("should return a null branch if there are no commits", function(done){
    makeRepo({commit: false}, (err, cwd) => {
      if (err) return done(err);
      getRepoInfo(cwd, (err, state) => {
        expect(err).to.be.null;
        expect(state).to.be.an("object");
        expect(state.branch).to.be.null;
        done()
      })
    })
  })
  it("should return the currently checked out branch if there are commits", function(done){
    makeRepo({commit: true}, (err, cwd) => {
      if (err) return done(err);
      getRepoInfo(cwd, (err, state) => {
        expect(err).to.be.null;
        expect(state).to.be.an("object");
        expect(state.branch).to.equal("master");
        done()
      })
    })
  })
  it("should return null remotes if the repo does not have any remotes set", function(done){
    makeRepo({remotes: {}}, (err, cwd) => {
      if (err) return done(err);
      getRepoInfo(cwd, (err, state) => {
        expect(err).to.be.null;
        expect(state).to.be.an("object");
        expect(state.remotes).to.be.null
        done()
      })
    })
  })
  it("should return a single remote if the repo has a single remotes set", function(done){
    const origin = "test"
    makeRepo({remotes: {origin}}, (err, cwd) => {
      if (err) return done(err);
      getRepoInfo(cwd, (err, state) => {
        expect(err).to.be.null;
        expect(state).to.be.an("object");
        expect(state.remotes).to.deep.equal({origin})
        done()
      })
    })
  })
  it("should return multiple remotes if the repo has muliple remotes set", function(done){
    const remotes = {
      origin: "test",
      upstream: "   this is a test  ",
      test: "another test \\n  \\t    \\n  \\t  ",
      none: "",
    }
    makeRepo({remotes}, (err, cwd) => {
      if (err) return done(err);
      getRepoInfo(cwd, (err, state) => {
        expect(err).to.be.null;
        expect(state).to.be.an("object");
        expect(state.remotes).to.deep.equal(remotes)
        done()
      })
    })
  })
  it("should return the name of the folder containing the repo", function(done){
    makeRepo({}, (err, cwd) => {
      if (err) return done(err);
      getRepoInfo(cwd, (err, state) => {
        expect(err).to.be.null;
        expect(state).to.be.an("object");
        expect(state.name).to.equal(basename(cwd))
        done()
      })
    })
  })
  it("should return the name of the parent directory of the repository", function(done){
    makeRepo({}, (err, cwd) => {
      if (err) return done(err);
      getRepoInfo(cwd, (err, state) => {
        expect(err).to.be.null;
        expect(state).to.be.an("object");
        expect(state.dir).to.equal("test")
        done()
      })
    })
  })

  it("should return the full path of the root of the repository", function(done){
    makeRepo({}, (err, cwd) => {
      if (err) return done(err);
      getRepoInfo(cwd, (err, state) => {
        expect(err).to.be.null;
        expect(state).to.be.an("object");
        expect(state.gitRoot).to.equal(cwd)
        done()
      })
    })
  })

  it("should return the same state regardless of where it is called from in the repo", function(testDone){
    makeRepo({subfolders: true, commit: true}, (err, cwd) => {
      if (err) return testDone(err);
      let stateFromSubFolder, stateFromSubSubFolder, stateFromRoot;
      parallel([
        done => getRepoInfo(cwd, (err, state) => {
          if (err) return done(err);
          stateFromRoot = state, done()
        }),
        done => getRepoInfo(join(cwd, "f1"), (err, state) => {
          if (err) return done(err);
          stateFromSubFolder = state, done()
        }),
        done => getRepoInfo(join(cwd, "f1", "f2"), (err, state) => {
          if (err) return done(err);
          stateFromSubSubFolder = state, done()
        })
      ], errs => {
        if (errs.length) return testDone(errs[0]);
        expect(stateFromRoot && stateFromSubFolder && stateFromSubSubFolder).to.be.ok
        expect(stateFromRoot).to.be.an("object");
        expect(stateFromSubFolder).to.be.an("object");
        expect(stateFromSubSubFolder).to.be.an("object")
        expect(stateFromSubFolder).to.deep.equal(stateFromRoot)
        expect(stateFromSubSubFolder).to.deep.equal(stateFromRoot)
        testDone()
      })
    })
  })

  it("should return no repo info for a dir that is not a repository", function(done){
    let didCallRoot;
    reverts.push(git.__set__("exec", (cmd, opts, cb) => {
      expect(cmd).to.equal("git rev-parse --show-toplevel")
      expect(opts.cwd).to.equal("not a repo")
      cb(new Error("Not a git repository"))
    }))
    reverts.push(getRepoInfo.__set__("getRoot", (...a) => {
      didCallRoot = true
      return git.getRoot(...a)
    }))
    getRepoInfo("not a repo", (err, state) => {
      expect(didCallRoot).to.be.true
      expect(err).to.be.null
      expect(state).to.be.undefined
      done()
    })
  })
  it("should return an error if it cannot get the root of the repo", function(done){
    let didCallRoot;
    reverts.push(git.__set__("exec", (cmd, opts, cb) => {
      expect(cmd).to.equal("git rev-parse --show-toplevel")
      expect(opts.cwd).to.equal("a repo")
      cb(new Error("Can't get the root"))
    }))
    reverts.push(getRepoInfo.__set__("getRoot", (...a) => {
      didCallRoot = true
      return git.getRoot(...a)
    }))
    getRepoInfo("a repo", (err, state) => {
      expect(didCallRoot).to.be.true
      expect(err).to.be.an("error")
      expect(err.message).to.equal("Can't get the root")
      expect(state).to.be.undefined
      done()
    })
  })
  it("should return an error if it cannot get the current branch", function(done){
    let didCallBranch, didCallRoot, didCallRemotes;
    reverts.push(git.__set__("exec", (cmd, opts, cb) => {
      expect(cmd).to.equal("git branch")
      expect(opts.cwd).to.equal("a repo")
      cb(new Error("Can't get the branch"))
    }))
    reverts.push(getRepoInfo.__set__("getBranch", (...a) => {
      didCallBranch = true
      return git.getBranch(...a)
    }))
    reverts.push(getRepoInfo.__set__("getRoot", (cwd, cb) => {
      didCallRoot = true;
      expect(cwd).to.equal("a repo");
      cb(null, "/some/root")
    }))
    reverts.push(getRepoInfo.__set__("getRemotes", (cwd, cb) => {
      didCallRemotes = true;
      expect(cwd).to.equal("a repo");
      cb(null, {origin: "test"})
    }))
    getRepoInfo("a repo", (err, state) => {
      expect(didCallBranch).to.be.true
      expect(didCallRoot).to.be.true
      expect(didCallRemotes).to.be.true
      expect(err).to.be.an("error")
      expect(err.message).to.equal("Can't get the branch")
      expect(state).to.be.undefined
      done()
    })
  })
  it("should return an error if it cannot get the remotes", function(done){
    let didCallBranch, didCallRoot, didCallRemotes;
    reverts.push(git.__set__("exec", (cmd, opts, cb) => {
      expect(cmd).to.equal("git remote --verbose")
      expect(opts.cwd).to.equal("a repo")
      cb(new Error("Can't get the remotes"))
    }))
    reverts.push(getRepoInfo.__set__("getBranch", (cwd, cb) => {
      didCallBranch = true
      expect(cwd).to.equal("a repo")
      cb(null, "master")
    }))
    reverts.push(getRepoInfo.__set__("getRoot", (cwd, cb) => {
      didCallRoot = true;
      expect(cwd).to.equal("a repo");
      cb(null, "/some/root")
    }))
    reverts.push(getRepoInfo.__set__("getRemotes", (...a) => {
      didCallRemotes = true;
      return git.getRemotes(...a)
    }))
    getRepoInfo("a repo", (err, state) => {
      expect(didCallBranch).to.be.true
      expect(didCallRoot).to.be.true
      expect(didCallRemotes).to.be.true
      expect(err).to.be.an("error")
      expect(err.message).to.equal("Can't get the remotes")
      expect(state).to.be.undefined
      done()
    })
  })
})
