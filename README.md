# atlas-repo-info

Get basic git repository information about a directory.

---

## install

```
npm install --save atlas-repo-info
```

## why

This function returns basic git information about a directory, so you don't need to clutter your codebase with git-related `exec` or `spawn` calls.

## examples

All you need to do is pass in the desired path to inspect, and a callback. If there is no `info` object passed to the callback, it means the passed directory is not a git repository. See caveats.

```javascript
const getRepoInfo = require("atlas-repo-info");
const projectPath = process.cwd();
getRepoInfo(projectPath, (err, info) => {
  if (err) return console.error(err);
  if (!info) return console.log(`${projectPath} is not a repo`);
  const { gitRoot, name, dir, branch, remotes } = info;
  // full path of the root of the git project
  console.log(gitRoot)
  // name of the project's folder
  console.log(name)
  // name of the project's parent dir
  console.log(dir)
  // name of the checked-out branch
  console.log(branch)
  // hash of remote name -> url pairs
  console.log(remotes)
  // url for the "origin" remote, if it exists
  if (remotes.origin)
    console.log(remotes.origin)
})
```

## caveats

You might run into issues if used with a bare repository (i.e. repoistories created with `git init --bare`). No check is currently implemented for bare repositories. It might be implemented later if I need it.
